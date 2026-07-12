package com.sdn.blacklist.batchscreening.service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.sdn.blacklist.batchscreening.dto.BatchRecordInput;
import com.sdn.blacklist.batchscreening.entity.BatchScreeningJob;
import com.sdn.blacklist.batchscreening.entity.BatchScreeningJob.BatchStatus;
import com.sdn.blacklist.batchscreening.entity.BatchScreeningResult;
import com.sdn.blacklist.batchscreening.repository.BatchScreeningJobRepository;
import com.sdn.blacklist.batchscreening.repository.BatchScreeningResultRepository;
import com.sdn.blacklist.screening.model.ScreeningMatch;
import com.sdn.blacklist.screening.model.ScreeningResult;
import com.sdn.blacklist.screening.service.ScreeningService;
import com.sdn.blacklist.tenant.context.TenantContext;
import com.sdn.blacklist.user.entity.User;

import lombok.extern.slf4j.Slf4j;

/**
 * Batch screening — البنك/الشركة يرفع ملف أسماء، منمرّرهن على نفس pipeline
 * الـ single screening (screenPersonFull) بس بدون auto-case/webhook (flag=false).
 *
 * أهم نقطة: نلتقط tenantId على thread الطلب، وبعدين نعيّنه على الـ virtual thread
 * قبل أي نداء لـ screenPersonFull — لأنه TenantContext (ThreadLocal) ما بينتقل تلقائياً.
 */
@Slf4j
@Service
public class BatchScreeningService {

    // نفس نمط SanctionSearchService — executor خاص، مش bean مشترك
    private static final ExecutorService VIRTUAL_EXECUTOR =
        Executors.newVirtualThreadPerTaskExecutor();

    // كل كم سطر منحدّث الـ progress بالـ DB (بدل ما نكتب مع كل سطر)
    private static final int PROGRESS_FLUSH_EVERY = 10;

    private final BatchScreeningJobRepository    jobRepository;
    private final BatchScreeningResultRepository resultRepository;
    private final BatchFileParser                fileParser;
    private final ScreeningService               screeningService;

    public BatchScreeningService(BatchScreeningJobRepository    jobRepository,
                                 BatchScreeningResultRepository resultRepository,
                                 BatchFileParser                fileParser,
                                 ScreeningService               screeningService) {
        this.jobRepository    = jobRepository;
        this.resultRepository = resultRepository;
        this.fileParser       = fileParser;
        this.screeningService = screeningService;
    }

    // ══════════════════════════════════════════
    //  START — يُستدعى على thread الطلب، يرجّع الـ job فوراً
    // ══════════════════════════════════════════
    public BatchScreeningJob startBatch(MultipartFile file, User currentUser) {

        // 1) التقط tenantId هون — على thread الطلب (null للسوبر أدمن)
        final Long tenantId = resolveTenantId(currentUser);

        // 2) parse متزامن: لازم قبل ما يخلص الطلب (الملف بالذاكرة)،
        //    وبيتيح رفض ملف بلا عمود اسم فوراً بـ 400 (BatchParseException)
        List<BatchRecordInput> records = fileParser.parse(file);

        // 3) أنشئ الـ job
        BatchScreeningJob job = new BatchScreeningJob();
        job.setTenantId(tenantId);
        job.setFileName(file.getOriginalFilename());
        job.setStatus(BatchStatus.PENDING);
        job.setTotalRecords(records.size());
        job.setProcessedRecords(0);
        job.setMatchedRecords(0);
        job.setCreatedBy(currentUser != null ? currentUser.getUsername() : "system");
        job.setCreatedAt(Instant.now());
        job = jobRepository.save(job);

        final Long   jobId = job.getId();
        final String user  = job.getCreatedBy();

        // 4) أطلق المعالجة بالخلفية على virtual thread
        VIRTUAL_EXECUTOR.submit(() -> processBatch(jobId, tenantId, user, records));

        return job;
    }

    // ══════════════════════════════════════════
    //  PROCESS — يعمل على virtual thread بالخلفية
    // ══════════════════════════════════════════
    private void processBatch(Long jobId, Long tenantId, String user,
                              List<BatchRecordInput> records) {
        long t0 = System.currentTimeMillis();

        BatchScreeningJob job = jobRepository.findById(jobId).orElse(null);
        if (job == null) { log.error("❌ Batch job {} disappeared before processing", jobId); return; }

        int processed = 0, matched = 0;
        try {
            job.setStatus(BatchStatus.PROCESSING);
            jobRepository.save(job);

            // ⚠️ عيّن الـ tenant على هالـ virtual thread — ThreadLocal ما بينتقل تلقائياً.
            // كل نداء screenPersonFull بيقرا TenantContext.getTenantId() من هون.
            TenantContext.setTenantId(tenantId);

            for (BatchRecordInput rec : records) {
                BatchScreeningResult row = newResultRow(jobId, tenantId, rec);

                // سطر أصلاً بايظ من الـ parser (بلا اسم / خلية بايظة) → خزّنو كخطأ وكمّل
                if (rec.hasError()) {
                    row.setMatch(false);
                    row.setRowError(rec.getRowError());
                    resultRepository.save(row);
                    processed++;
                    if (processed % PROGRESS_FLUSH_EVERY == 0) flushProgress(job, processed, matched);
                    continue;
                }

                try {
                    // نفس pipeline الـ single screening — بس false = بلا case تلقائي/webhook
                    ScreeningResult sr = screeningService.screenPersonFull(
                        rec.getFullName(),
                        null,                    // fullNameAr (بيتحدد داخلياً لو الاسم عربي)
                        rec.getNationality(),
                        rec.getDob(),
                        rec.getIdType(),
                        rec.getIdNumber(),
                        rec.getCountry(),
                        rec.getMotherName(),
                        null,                    // createdBy — منسبها للـ batch مش لمستخدم
                        false);                  // autoCreateCaseAndNotify

                    applySummary(row, sr);
                    if (row.isMatch()) matched++;
                    resultRepository.save(row);

                } catch (Exception ex) {
                    row.setMatch(false);
                    row.setRowError("فشل الفحص: " + ex.getMessage());
                    resultRepository.save(row);
                    log.warn("⚠️ Batch job {} row {} screening failed: {}",
                        jobId, rec.getRowNumber(), ex.getMessage());
                }

                processed++;
                if (processed % PROGRESS_FLUSH_EVERY == 0) flushProgress(job, processed, matched);
            }

            job.setStatus(BatchStatus.COMPLETED);

        } catch (Exception fatal) {
            job.setStatus(BatchStatus.FAILED);
            job.setErrorMessage(trim(fatal.getMessage(), 1000));
            log.error("❌ Batch job {} failed: {}", jobId, fatal.getMessage(), fatal);
        } finally {
            TenantContext.clear();
            job.setProcessedRecords(processed);
            job.setMatchedRecords(matched);
            job.setCompletedAt(Instant.now());
            jobRepository.save(job);
            log.info("✅ Batch job {} done: {}/{} processed | {} matched | {}ms",
                jobId, processed, job.getTotalRecords(), matched,
                System.currentTimeMillis() - t0);
        }
    }

    private BatchScreeningResult newResultRow(Long jobId, Long tenantId, BatchRecordInput rec) {
        BatchScreeningResult row = new BatchScreeningResult();
        row.setJobId(jobId);
        row.setTenantId(tenantId);
        row.setRowNumber(rec.getRowNumber());
        row.setInputName(rec.getFullName());
        row.setInputDob(rec.getRawDob());
        row.setInputNationality(rec.getNationality());
        row.setInputIdType(rec.getIdType());
        row.setInputIdNumber(rec.getIdNumber());
        row.setInputCountry(rec.getCountry());
        row.setInputMotherName(rec.getMotherName());
        return row;
    }

    private void flushProgress(BatchScreeningJob job, int processed, int matched) {
        job.setProcessedRecords(processed);
        job.setMatchedRecords(matched);
        jobRepository.save(job);
    }

    // ══════════════════════════════════════════
    //  ملخّص النتيجة → صف التقرير
    //  ⚠️ getters مفترضة — أكّدها على موديلك:
    //     ScreeningResult:  Long getId(), RiskLevel getRiskLevel(), List<ScreeningMatch> getMatches()
    //     ScreeningMatch:   String getMatchedName(), String getSource(),
    //                       Double getMatchScore(), String getNotes()
    // ══════════════════════════════════════════
    private void applySummary(BatchScreeningResult row, ScreeningResult sr) {
        row.setScreeningResultId(sr.getId());
        row.setRiskLevel(sr.getRiskLevel() != null ? sr.getRiskLevel().name() : null);

        List<ScreeningMatch> matches = sr.getMatches();
        if (matches == null) matches = List.of();

        // استثنِ صف country-risk الصناعي (source=FATF, name="Country Risk: ...")
        List<ScreeningMatch> real = matches.stream()
            .filter(m -> m.getSource() == null || !m.getSource().equalsIgnoreCase("FATF"))
            .filter(m -> m.getMatchedName() == null || !m.getMatchedName().startsWith("Country Risk:"))
            .toList();

        row.setMatchCount(real.size());
        row.setMatch(!real.isEmpty());

        ScreeningMatch best = real.stream()
            .max(Comparator.comparingDouble(
                m -> m.getMatchScore() != null ? m.getMatchScore() : 0.0))
            .orElse(null);

        if (best != null) {
            row.setMatchedName(best.getMatchedName());
            row.setMatchedSource(best.getSource());
            row.setBestScore(best.getMatchScore());
            row.setConfirmingFactor(extractConfidence(best.getNotes()));
        }
    }

    // بيطلع مستوى التأكيد من notes ("... | Confidence: PROBABLE | ...")
    private String extractConfidence(String notes) {
        if (notes == null) return null;
        int i = notes.indexOf("Confidence: ");
        if (i < 0) return null;
        int start = i + "Confidence: ".length();
        int end   = notes.indexOf(" |", start);
        String v  = (end < 0 ? notes.substring(start) : notes.substring(start, end)).trim();
        return v.isEmpty() ? null : v;
    }

    private static String trim(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }

    // ── read tenant on request thread (WebhookController-style fallback) ──
    private Long resolveTenantId(User currentUser) {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null && currentUser != null)
            tenantId = currentUser.getTenantId();
        if (tenantId == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof User user)
                tenantId = user.getTenantId();
        }
        return tenantId;
    }

    // ══════════════════════════════════════════
    //  Queries للـ controller
    // ══════════════════════════════════════════
    public Optional<BatchScreeningJob> getJob(Long jobId) {
        return jobRepository.findById(jobId);
    }

    public List<BatchScreeningResult> getResults(Long jobId) {
        return resultRepository.findByJobIdOrderByRowNumberAsc(jobId);
    }

    public List<BatchScreeningJob> getHistory(Long tenantId) {
        return tenantId == null
            ? jobRepository.findAllByOrderByCreatedAtDesc()
            : jobRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }
}