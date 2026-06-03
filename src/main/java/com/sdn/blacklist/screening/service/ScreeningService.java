package com.sdn.blacklist.screening.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.sdn.blacklist.cases.dto.CaseRequest;
import com.sdn.blacklist.cases.service.CaseService;
import com.sdn.blacklist.common.dto.SanctionSearchResult;
import com.sdn.blacklist.common.dto.SanctionSearchResult.ConfirmingData;
import com.sdn.blacklist.common.dto.SanctionSearchResult.SanctionRecordData;
import com.sdn.blacklist.common.service.CountryRiskService;
import com.sdn.blacklist.common.service.SanctionSearchService;
import com.sdn.blacklist.common.util.SmartNameMatcher;
import com.sdn.blacklist.screening.model.RiskLevel;
import com.sdn.blacklist.screening.model.ScreeningMatch;
import com.sdn.blacklist.screening.model.ScreeningRequest;
import com.sdn.blacklist.screening.model.ScreeningResult;
import com.sdn.blacklist.screening.model.ScreeningStatus;
import com.sdn.blacklist.screening.repository.ScreeningMatchRepository;
import com.sdn.blacklist.screening.repository.ScreeningRequestRepository;
import com.sdn.blacklist.screening.repository.ScreeningResultRepository;
import com.sdn.blacklist.tenant.context.TenantContext;
import com.sdn.blacklist.tenant.service.RateLimitService;
import com.sdn.blacklist.user.entity.User;
import com.sdn.blacklist.webhook.service.WebhookService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ScreeningService {

    private final ScreeningRequestRepository requestRepository;
    private final ScreeningResultRepository  resultRepository;
    private final ScreeningMatchRepository   matchRepository;
    private final SanctionSearchService      sanctionSearchService;
    private final CaseService                caseService;
    private final RateLimitService           rateLimitService;
    private final WebhookService             webhookService;
    private final CountryRiskService         countryRiskService;

    public ScreeningService(ScreeningRequestRepository requestRepository,
                             ScreeningResultRepository  resultRepository,
                             ScreeningMatchRepository   matchRepository,
                             SanctionSearchService      sanctionSearchService,
                             CaseService                caseService,
                             RateLimitService           rateLimitService,
                             WebhookService             webhookService,
                             CountryRiskService         countryRiskService) {
        this.requestRepository     = requestRepository;
        this.resultRepository      = resultRepository;
        this.matchRepository       = matchRepository;
        this.sanctionSearchService = sanctionSearchService;
        this.caseService           = caseService;
        this.rateLimitService      = rateLimitService;
        this.webhookService        = webhookService;
        this.countryRiskService    = countryRiskService;
    }

    @Transactional
    public ScreeningResult screenPerson(String fullName, User createdBy) {
        return screenPersonFull(fullName, null, null, null, null, null, null, createdBy);
    }

    @Transactional
    public ScreeningResult screenPersonFull(
            String    fullName,
            String    fullNameAr,
            String    nationality,
            LocalDate dob,
            String    idType,
            String    idNumber,
            String    country,
            User      createdBy) {

        long T0 = System.currentTimeMillis();

        Long tenantId = TenantContext.getTenantId();
        rateLimitService.countRequest();

        ConfirmingData confirmingData = ConfirmingData.fromRequest(
            nationality, dob, idNumber, idType);
        boolean hasConfirmingData = !confirmingData.isEmpty();

        log.info("🔍 Screening: '{}'", fullName);

        String searchFullName = fullName;
        String searchFullNameAr = fullNameAr;

        if (SmartNameMatcher.isArabic(fullName)) {
            searchFullNameAr = fullName; // العربي → للبحث الثاني
            String translit = SmartNameMatcher.transliterate(
                SmartNameMatcher.normalizeAr(fullName));
            searchFullName = translit.isBlank() ? fullName : translit;
            log.info("🔀 Arabic input detected: '{}' → translit='{}'", fullName, searchFullName);
        }

        // ── DB: Save request ──────────────────────────────────────────────────
        long t1 = System.currentTimeMillis();
        ScreeningRequest request = new ScreeningRequest();
        request.setFullName(fullName);
        request.setFullNameAr(fullNameAr);
        request.setCountry(country);
        request.setNationality(nationality);
        request.setDob(dob);
        request.setIdType(idType);
        request.setIdNumber(idNumber);
        request.setCreatedAt(LocalDateTime.now());
        request.setCreatedBy(createdBy);
        request.setStatus(ScreeningStatus.COMPLETED);
        request.setTenantId(tenantId);
        requestRepository.save(request);

        ScreeningResult result = new ScreeningResult();
        result.setRequest(request);
        result.setStatus(ScreeningStatus.COMPLETED);
        result.setCreatedAt(LocalDateTime.now());
        result.setTenantId(tenantId);
        result = resultRepository.save(result);
        log.info("⏱️ [1] DB save request+result: {}ms", System.currentTimeMillis() - t1);

        // ── SEARCH (capped at 1200ms via SanctionSearchService) ───────────────
       long t2 = System.currentTimeMillis();

        // ✅ ابحث بالإنجليزي (أو الـ translit لو الإدخال عربي)
        List<SanctionSearchResult> searchResults = new ArrayList<>(
            sanctionSearchService.search(searchFullName, 75.0, 0, 10));

        // ✅ ابحث بالعربي وادمج النتائج الجديدة فقط (بدون تكرار نفس الـ UUID)
        String arQuery = searchFullNameAr != null && !searchFullNameAr.isBlank()
            ? searchFullNameAr
            : SmartNameMatcher.isArabic(fullName) ? fullName : null;

        if (arQuery != null) {
            List<String> existingIds = searchResults.stream()
                .filter(r -> r.getId() != null)
                .map(r -> r.getId().toString())
                .toList();
            sanctionSearchService.search(arQuery, 75.0, 0, 10).stream()
                .filter(r -> r.getId() == null
                        || !existingIds.contains(r.getId().toString()))
                .forEach(searchResults::add);
        }

        log.info("⏱️ [2] Search: {}ms | {} raw results",
            System.currentTimeMillis() - t2, searchResults.size());

        // ── Merge + build matches ─────────────────────────────────────────────
        long t4 = System.currentTimeMillis();
        List<MergedMatch> mergedMatches = mergeResults(fullName, searchResults);
        double totalRiskPoints = 0;
        double maxSingleScore  = 0;

        for (MergedMatch merged : mergedMatches) {
            ScreeningMatch match = new ScreeningMatch();
            match.setMatchedName(merged.name);
            match.setSource(merged.sourcesLabel());
            match.setMatchScore(merged.bestScore);
            match.setSanctionId(merged.bestSanctionId);
            match.setSanctionRefs(merged.sanctionRefsJson());
            match.setNotes(buildMatchNotes(merged));
            match.setWikidataId(merged.wikidataId);
            match.setWeight(merged.maxWeight);
            match.setRiskPoints(merged.riskPoints);
            match.setPep(merged.isPep);
            result.addMatch(match);
            totalRiskPoints += merged.riskPoints;
            maxSingleScore   = Math.max(maxSingleScore, merged.riskPoints);
        }
        log.info("⏱️ [4] Merge+build: {}ms | {} matches",
            System.currentTimeMillis() - t4, mergedMatches.size());

        // ── Country risk ──────────────────────────────────────────────────────
        long t5 = System.currentTimeMillis();
        double countryRiskScore = countryRiskService.getRiskScore(country);
        if (countryRiskScore > 0) {
            double crp = countryRiskScore * 0.5;
            ScreeningMatch cm = new ScreeningMatch();
            cm.setMatchedName("Country Risk: " + country
                + " [" + countryRiskService.getRiskTier(country) + "]");
            cm.setSource("FATF"); cm.setMatchScore(countryRiskScore);
            cm.setRiskPoints(crp);
            cm.setNotes("FATF " + countryRiskService.getRiskTier(country)
                + " country — auto risk added");
            result.addMatch(cm);
            totalRiskPoints += crp;
            maxSingleScore   = Math.max(maxSingleScore, crp);
        }
        log.info("⏱️ [5] Country risk: {}ms", System.currentTimeMillis() - t5);

        // ── Risk level ────────────────────────────────────────────────────────
        if (totalRiskPoints == 0) {
            result.setRiskLevel(RiskLevel.VERY_LOW);
            result.setNotes("No match — Auto APPROVED");
        } else if (maxSingleScore >= 100) {
            result.setRiskLevel(RiskLevel.CRITICAL);
            result.setNotes("Auto BLOCKED — Immediate action required");
        } else if (maxSingleScore >= 70 || totalRiskPoints > 130) {
            result.setRiskLevel(RiskLevel.HIGH);
            result.setNotes("Requires ADMIN review");
        } else if (maxSingleScore >= 35 || totalRiskPoints > 80) {
            result.setRiskLevel(RiskLevel.MEDIUM);
            result.setNotes("Requires ADMIN review");
        } else {
            result.setRiskLevel(RiskLevel.LOW);
            result.setNotes("No action required — Auto APPROVED");
        }

        // ── DB: Save result ───────────────────────────────────────────────────
        long t6 = System.currentTimeMillis();
        ScreeningResult saved = resultRepository.save(result);
        log.info("⏱️ [6] DB save result: {}ms", System.currentTimeMillis() - t6);

        // ══════════════════════════════════════════════════════════════════════
        //  🚀 ASYNC POST-COMMIT — autoCreateCase + webhooks
        //
        //  المشكلة القديمة:
        //  - autoCreateCase: DB writes + case service بتشتغل sync → تأخير
        //  - webhookService.trigger: HTTP call خارجي sync → تأخير كبير جداً
        //    لو الـ webhook URL بطيء أو ما شغّال = 15-20s blocking!!
        //
        //  الحل:
        //  - TransactionSynchronizationManager.registerSynchronization:
        //    يشجّل callback ينشغل بعد commit الـ transaction مباشرة
        //  - CompletableFuture.runAsync: يشغّل async في virtual thread
        //  - الـ response بيرجع للـ user بعد commit مباشرة
        //    بدون انتظار case creation أو webhook
        // ══════════════════════════════════════════════════════════════════════
        final ScreeningResult finalSaved     = saved;
        final String          finalFullName  = fullName;
        final int             finalCount     = mergedMatches.size();
        final String          finalUsername  = createdBy != null ? createdBy.getUsername() : "system";
        final RiskLevel       finalRisk      = saved.getRiskLevel();
        final Long            finalTenantId  = tenantId;

        TransactionSynchronizationManager.registerSynchronization(
            new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    // ✅ Case creation — async بعد الـ commit
                    CompletableFuture.runAsync(() -> {
                            try {
                                TenantContext.setTenantId(finalTenantId); // ✅ ضبط الـ context
                                doAutoCreateCase(finalSaved, finalFullName, finalCount, finalUsername);
                            } catch (Exception e) {
                                log.warn("⚠️ Async case creation failed: {}", e.getMessage());
                            } finally {
                                TenantContext.clear(); // ✅ نظّف بعد الانتهاء
                            }
                        });

                    // ✅ Webhooks — async بعد الـ commit
                    CompletableFuture.runAsync(() -> {
                        try {
                            long tw = System.currentTimeMillis();
                            if (finalRisk == RiskLevel.CRITICAL) {
                                webhookService.trigger(finalTenantId,
                                    WebhookService.EVENT_SCREENING_CRITICAL,
                                    Map.of("personName", finalFullName,
                                           "riskLevel", "CRITICAL",
                                           "screeningId", finalSaved.getId()));
                            } else if (finalRisk == RiskLevel.HIGH) {
                                webhookService.trigger(finalTenantId,
                                    WebhookService.EVENT_SCREENING_HIGH,
                                    Map.of("personName", finalFullName,
                                           "riskLevel", "HIGH",
                                           "screeningId", finalSaved.getId()));
                            }
                            log.info("⏱️ [8] Webhook: {}ms",
                                System.currentTimeMillis() - tw);
                        } catch (Exception e) {
                            log.warn("⚠️ Async webhook failed: {}", e.getMessage());
                        }
                    });
                }
            });

        log.info("⏱️ [TOTAL sync] Screening '{}': {}ms | Risk: {}",
            fullName, System.currentTimeMillis() - T0, saved.getRiskLevel());

        return saved;
    }

    // ══════════════════════════════════════════
    //  applyConfirmingFactors
    // ══════════════════════════════════════════
    private void applyConfirmingFactors(List<SanctionSearchResult> results,
                                         ConfirmingData input) {
        for (SanctionSearchResult result : results) {
            SanctionRecordData data = extractSanctionData(result);
            result.applyConfirmingFactors(input, data);
            log.debug("✅ Confirming [{}]: level={}", result.getName(),
                result.getConfidenceLevel());
        }
    }

    private SanctionRecordData extractSanctionData(SanctionSearchResult result) {
        return SanctionRecordData.empty();
    }

    // ══════════════════════════════════════════
    //  buildMatchNotes
    // ══════════════════════════════════════════
    private String buildMatchNotes(MergedMatch merged) {
        StringBuilder sb = new StringBuilder();
        if (merged.notes != null && !merged.notes.isBlank()) sb.append(merged.notes);
        if (merged.confidenceLevel != null && !"UNCONFIRMED".equals(merged.confidenceLevel)) {
            if (sb.length() > 0) sb.append(" | ");
            sb.append("Confidence: ").append(merged.confidenceLevel);
        }
        if (merged.dobConfidence != null && !"UNAVAILABLE".equals(merged.dobConfidence))
            sb.append(" | DOB: ").append(merged.dobConfidence);
        if (merged.idConfidence != null && !"UNAVAILABLE".equals(merged.idConfidence))
            sb.append(" | ID: ").append(merged.idConfidence);
        return sb.length() > 0 ? sb.toString() : null;
    }

    // ══════════════════════════════════════════
    //  Merge Results + Cross-Script
    // ══════════════════════════════════════════
    private List<MergedMatch> mergeResults(String query,
                                            List<SanctionSearchResult> results) {
        Map<String, MergedMatch> groups = new LinkedHashMap<>();
        for (SanctionSearchResult sr : results) {
            if (sr.getNameSimilarity() < 70.0) continue;
            String normName = SmartNameMatcher.normalize(sr.getName());
            String key      = findGroupKey(groups, normName, sr.getNameSimilarity());
            if (key == null) {
                key = normName;
                groups.put(key, new MergedMatch(sr));
            } else {
                groups.get(key).merge(sr);
            }
        }
        return groups.values().stream()
            .sorted((a, b) -> Double.compare(b.riskPoints, a.riskPoints))
            .collect(Collectors.toList());
    }

   private String findGroupKey(Map<String, MergedMatch> groups,
                                    String normName, double sim) {
            for (Map.Entry<String, MergedMatch> entry : groups.entrySet()) {
                double nameSim = SmartNameMatcher.match(entry.getKey(), normName, List.of());
                
                // ✅ رجّعنا 65% بس أضفنا guard — لازم يكون في token مشترك
                if (nameSim >= 65.0 && hasSharedToken(entry.getKey(), normName))
                    return entry.getKey();
                
                // Cross-script: عربي/لاتيني
                if (isDifferentScript(entry.getKey(), normName)
                        && sim >= 78.0 && entry.getValue().bestScore >= 78.0
                        && hasSharedToken(entry.getKey(), normName))
                    return entry.getKey();
            }
            return null;
        }

        // ✅ يتحقق إن في كلمة مشتركة بين الاسمين (تمنع دمج Bashar مع Hael)
        private static boolean hasSharedToken(String a, String b) {
            List<String> tA = SmartNameMatcher.tokenize(a).stream()
                .filter(t -> t.length() >= 3 && !isStopword(t)).toList();
            List<String> tB = SmartNameMatcher.tokenize(b).stream()
                .filter(t -> t.length() >= 3 && !isStopword(t)).toList();
            if (tA.isEmpty() || tB.isEmpty()) return false;
            return tA.stream().anyMatch(ta ->
                tB.stream().anyMatch(tb ->
                    SmartNameMatcher.levenshteinSimilarity(ta, tb) >= 80.0));
        }

        private static boolean isStopword(String t) {
            return Set.of("al","el","bin","bint","abu","von","van","de","ibn").contains(t);
        }

    private static boolean isDifferentScript(String a, String b) {
        boolean aAr = a.chars().anyMatch(
            c -> Character.UnicodeBlock.of(c) == Character.UnicodeBlock.ARABIC);
        boolean bAr = b.chars().anyMatch(
            c -> Character.UnicodeBlock.of(c) == Character.UnicodeBlock.ARABIC);
        return aAr != bAr;
    }

    // ══════════════════════════════════════════
    //  MergedMatch
    // ══════════════════════════════════════════
    private static class MergedMatch {
        String           name;
        List<String>     sources = new ArrayList<>();
        double           bestScore;
        String           bestSanctionId;
        Map<String,String> sourceIds = new LinkedHashMap<>();
        String           notes, wikidataId;
        double           maxWeight, riskPoints;
        boolean          isPep;
        String           confidenceLevel = "UNCONFIRMED";
        String           dobConfidence   = "UNAVAILABLE";
        String           idConfidence    = "UNAVAILABLE";

        MergedMatch(SanctionSearchResult sr) {
            name           = sr.getName();
            bestScore      = sr.getNameSimilarity();
            notes          = sr.getNotes();
            wikidataId     = sr.getWikidataId();
            isPep          = "PEP".equalsIgnoreCase(sr.getSource());
            maxWeight      = calcWeight(sr.getSource());
            bestSanctionId = (!isPep && sr.getId() != null) ? sr.getId().toString() : null;
            if (!isPep && sr.getId() != null && sr.getSource() != null)
                storeId(sr.getSource(), sr.getId().toString());
            confidenceLevel = sr.getConfidenceLevel();
            dobConfidence   = sr.getDobConfidence();
            idConfidence    = sr.getIdConfidence();
            if (!isPep) {
                sources.add(sr.getSource());
                riskPoints = calcRisk(sr.getNameSimilarity(), maxWeight);
            } else {
                riskPoints = calcRiskPep(sr.getNameSimilarity());
            }
            applyBoost();
        }

        void merge(SanctionSearchResult sr) {
            if (sr.getNameSimilarity() > bestScore) {
                bestScore = sr.getNameSimilarity(); name = sr.getName();
                confidenceLevel = sr.getConfidenceLevel();
                dobConfidence = sr.getDobConfidence();
                idConfidence = sr.getIdConfidence();
            }
            if (sr.getId() != null && !isPepSrc(sr.getSource())) {
                if (bestSanctionId == null || sr.getNameSimilarity() >= bestScore)
                    bestSanctionId = sr.getId().toString();
                if (sr.getSource() != null)
                    storeId(sr.getSource(), sr.getId().toString());
            }
            double w = calcWeight(sr.getSource());
            if (w > maxWeight) maxWeight = w;
            if ("PEP".equalsIgnoreCase(sr.getSource())) {
                isPep = true;
                notes      = sr.getNotes()      != null ? sr.getNotes()      : notes;
                wikidataId = sr.getWikidataId() != null ? sr.getWikidataId() : wikidataId;
            } else if (!sources.contains(sr.getSource())) {
                sources.add(sr.getSource());
            }
            recalc();
        }

        private void storeId(String src, String id) {
            for (String p : src.split("\\|")) {
                String k = p.trim().toUpperCase();
                if (!k.isEmpty() && !k.equals("PEP")) sourceIds.putIfAbsent(k, id);
            }
        }

        String sanctionRefsJson() {
            if (sourceIds.isEmpty()) return null;
            StringBuilder sb = new StringBuilder("{");
            boolean first = true;
            for (Map.Entry<String,String> e : sourceIds.entrySet()) {
                if (!first) sb.append(",");
                sb.append("\"").append(e.getKey())
                  .append("\":\"").append(e.getValue()).append("\"");
                first = false;
            }
            return sb.append("}").toString();
        }

        void applyBoost() {
            double m = switch (confidenceLevel != null ? confidenceLevel : "UNCONFIRMED") {
                case "CONFIRMED" -> 1.20;
                case "PROBABLE"  -> 1.10;
                case "POSSIBLE"  -> 1.05;
                default          -> 1.00;
            };
            riskPoints *= m;
        }

        private static boolean isPepSrc(String s) { return "PEP".equalsIgnoreCase(s); }

        void recalc() {
            riskPoints = !sources.isEmpty()
                ? calcRisk(bestScore, maxWeight)
                : isPep ? calcRiskPep(bestScore) : 0;
            applyBoost();
        }

        String sourcesLabel() {
            String lbl = String.join(" | ", sources);
            if (isPep) lbl = lbl.isEmpty() ? "PEP" : lbl + " | PEP";
            return lbl.isEmpty() ? "UNKNOWN" : lbl;
        }

        static double calcWeight(String s) {
            return switch ((s != null ? s : "").toUpperCase()) {
                case "OFAC","UN","EU","UK","LOCAL" -> 1.5;
                case "PEP"                         -> 1.25;
                case "INTERPOL"                    -> 1.2;
                case "FATF","WORLD_BANK"            -> 1.1;
                default                            -> 1.0;
            };
        }
        static double calcRisk(double sim, double w) {
            if (sim <= 70) return 0;
            //  floor 40 نقطة لأي match — أي مطابقة بقائمة عقوبات = MEDIUM على الأقل
            double base = 40.0 + ((sim - 70.0) / 30.0) * 60.0;
            return base * w;
        }
        static double calcRiskPep(double sim) { return (sim / 100.0) * 125; }
    }

    // ══════════════════════════════════════════
    //  Auto-create Case (يُستدعى async بعد commit)
    // ══════════════════════════════════════════
    private void doAutoCreateCase(ScreeningResult result, String fullName,
                                   int matchCount, String username) {
        RiskLevel risk = result.getRiskLevel();
        if (risk == RiskLevel.VERY_LOW || risk == RiskLevel.LOW) return;
        try {
            CaseRequest req = new CaseRequest();
            req.setCaseType("PERSON");
            req.setScreeningId(result.getId());
            req.setSubjectName(fullName);
            req.setPriority(mapPriority(risk));
            req.setAssignedTo(null);
            String status = (risk == RiskLevel.CRITICAL) ? "ESCALATED" : "OPEN";
            req.setNotes("Auto-created — Risk: " + risk
                + " | Matches: " + matchCount + " | Status: " + status);
            var created = caseService.createCase(req, username);
            if (risk == RiskLevel.CRITICAL) {
                caseService.updateStatus(created.getId(),
                    "ESCALATED", "Auto-escalated due to CRITICAL risk", "system");
            }
            log.info("✅ Case #{} for '{}' — {}", created.getId(), fullName, risk);
        } catch (Exception e) {
            log.warn("⚠️ Case not created for '{}': {}", fullName, e.getMessage());
        }
    }

    // Keep old name for backward compat (unused now — kept for compile)
    private void autoCreateCase(ScreeningResult r, String n, int c, String u) {
        doAutoCreateCase(r, n, c, u);
    }

    private String mapPriority(RiskLevel risk) {
        return switch (risk) {
            case CRITICAL -> "CRITICAL";
            case HIGH     -> "HIGH";
            case MEDIUM   -> "MEDIUM";
            default       -> "LOW";
        };
    }

    // ══════════════════════════════════════════
    //  History
    // ══════════════════════════════════════════
    public List<ScreeningResult> getHistory() {
        Long tenantId = TenantContext.getTenantId();
        return tenantId == null
            ? resultRepository.findAllByOrderByCreatedAtDesc()
            : resultRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    public List<ScreeningResult> getHistoryByUser(String username) {
        Long tenantId = TenantContext.getTenantId();
        return tenantId == null
            ? resultRepository.findByCreatedByUsername(username)
            : resultRepository.findByCreatedByUsernameAndTenantId(username, tenantId);
    }
}