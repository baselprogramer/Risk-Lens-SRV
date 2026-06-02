package com.sdn.blacklist.screening.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    // ══════════════════════════════════════════
    //  screenPerson — الـ method الأصلي
    //  مبقى كما هو للتوافق مع الكود القديم
    // ══════════════════════════════════════════
    @Transactional
    public ScreeningResult screenPerson(String fullName, User createdBy) {
        return screenPersonFull(fullName, null, null, null, null, null, null, createdBy);
    }

    // ══════════════════════════════════════════
    //  screenPersonFull — الـ method الجديد مع KYC
    //  يستقبل بيانات كاملة من برنامج الصرافة
    // ══════════════════════════════════════════
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

        Long tenantId = TenantContext.getTenantId();
        rateLimitService.countRequest();

        // ── بناء الـ ConfirmingData من البيانات المُدخلة ──
        ConfirmingData confirmingData = ConfirmingData.fromRequest(
            nationality, dob, idNumber, idType);

        log.info("🔍 Screening: name='{}' | nationality={} | dob={} | idType={} | hasId={}",
            fullName, nationality, dob, idType,
            idNumber != null && !idNumber.isBlank());

        // ── إنشاء الطلب مع الحقول الجديدة ──
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

        // ── إنشاء النتيجة ──
        ScreeningResult result = new ScreeningResult();
        result.setRequest(request);
        result.setStatus(ScreeningStatus.COMPLETED);
        result.setCreatedAt(LocalDateTime.now());
        result.setTenantId(tenantId);
        result = resultRepository.save(result);

        // ── البحث: الاسم الإنجليزي دائماً ──
        List<SanctionSearchResult> searchResults = new ArrayList<>(
            sanctionSearchService.search(fullName, 70.0, 0, 10));

        // ── إذا في اسم عربي → ابحث به أيضاً وادمج ──
        if (fullNameAr != null && !fullNameAr.isBlank()) {
            List<String> existingIds = searchResults.stream()
                .filter(r -> r.getId() != null)
                .map(r -> r.getId().toString())
                .collect(Collectors.toList());

            sanctionSearchService.search(fullNameAr, 70.0, 0, 10).stream()
                .filter(r -> r.getId() == null || !existingIds.contains(r.getId().toString()))
                .forEach(searchResults::add);
        }

        // ── تطبيق الـ Confirming Factors على كل match ──
        if (!confirmingData.isEmpty()) {
            applyConfirmingFactors(searchResults, confirmingData);
        }

        // ── دمج النتائج ──
        List<MergedMatch> mergedMatches = mergeResults(fullName, searchResults);

        double totalRiskPoints = 0;
        double maxSingleScore  = 0;

        for (MergedMatch merged : mergedMatches) {
            ScreeningMatch match = new ScreeningMatch();
            match.setMatchedName(merged.name);
            match.setSource(merged.sourcesLabel());
            match.setMatchScore(merged.bestScore);
            match.setSanctionId(merged.bestSanctionId);
            match.setNotes(buildMatchNotes(merged));
            match.setWikidataId(merged.wikidataId);
            match.setWeight(merged.maxWeight);
            match.setRiskPoints(merged.riskPoints);
            match.setPep(merged.isPep);
            result.addMatch(match);

            totalRiskPoints += merged.riskPoints;
            maxSingleScore   = Math.max(maxSingleScore, merged.riskPoints);
        }

        // ── Country Risk من FATF ──
        double countryRiskScore = countryRiskService.getRiskScore(country);
        if (countryRiskScore > 0) {
            double countryRiskPoints = countryRiskScore * 0.5;
            ScreeningMatch countryMatch = new ScreeningMatch();
            countryMatch.setMatchedName("Country Risk: " + country
                + " [" + countryRiskService.getRiskTier(country) + "]");
            countryMatch.setSource("FATF");
            countryMatch.setMatchScore(countryRiskScore);
            countryMatch.setRiskPoints(countryRiskPoints);
            countryMatch.setNotes("FATF " + countryRiskService.getRiskTier(country)
                + " country — auto risk added");
            result.addMatch(countryMatch);
            totalRiskPoints += countryRiskPoints;
            maxSingleScore   = Math.max(maxSingleScore, countryRiskPoints);
        }

        // ══════════════════════════════════════════
        //  حساب مستوى الخطر
        //  نفس المنطق الأصلي — الـ confirming factors
        //  رفعت الـ scores قبل الوصول لهون
        // ══════════════════════════════════════════
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

        ScreeningResult saved = resultRepository.save(result);

        autoCreateCase(saved, fullName, mergedMatches.size(),
            createdBy != null ? createdBy.getUsername() : "system");

        // ── Webhook ──
        if (saved.getRiskLevel() == RiskLevel.CRITICAL) {
            webhookService.trigger(tenantId, WebhookService.EVENT_SCREENING_CRITICAL,
                Map.of("personName", fullName, "riskLevel", "CRITICAL",
                       "screeningId", saved.getId()));
        } else if (saved.getRiskLevel() == RiskLevel.HIGH) {
            webhookService.trigger(tenantId, WebhookService.EVENT_SCREENING_HIGH,
                Map.of("personName", fullName, "riskLevel", "HIGH",
                       "screeningId", saved.getId()));
        }

        return saved;
    }

    // ══════════════════════════════════════════
    //  applyConfirmingFactors
    //
    //  يمر على كل match ويطبّق الـ confirming factors
    //  مقارنةً ببيانات القائمة الموجودة في الـ document
    //
    //  المشكلة: Elasticsearch ما بيرجع دايماً DOB ورقم
    //  الوثيقة في الـ SanctionSearchResult الحالي.
    //  الحل: نحاول نستخرجها من الـ notes أو نبني
    //  SanctionRecordData من المعلومات المتاحة.
    //  في المرحلة الأولى نستخدم ما هو متاح.
    // ══════════════════════════════════════════
    private void applyConfirmingFactors(List<SanctionSearchResult> results,
                                         ConfirmingData input) {
        for (SanctionSearchResult result : results) {
            // استخرج بيانات السجل من الـ document
            // في المرحلة الأولى: نستخدم SanctionRecordData.empty()
            // وسنوسّع هاد لاحقاً لما نضيف الـ fields للـ ES document
            SanctionRecordData sanctionData = extractSanctionData(result);
            result.applyConfirmingFactors(input, sanctionData);

            log.debug("✅ Confirming [{}]: nationality={} | dob={} | id={} | boost={} | level={}",
                result.getName(),
                result.getNationalityConfidence(),
                result.getDobConfidence(),
                result.getIdConfidence(),
                result.getConfirmingBoost(),
                result.getConfidenceLevel());
        }
    }

    // ══════════════════════════════════════════
    //  extractSanctionData
    //  يستخرج بيانات السجل من الـ SanctionSearchResult
    //  الحالي. في المرحلة الأولى البيانات محدودة،
    //  ستتوسع لما نضيف nationality/dob للـ ES index.
    // ══════════════════════════════════════════
    private SanctionRecordData extractSanctionData(SanctionSearchResult result) {
        // TODO: لما يُضاف nationality وdob وidNumber للـ SanctionSearchDocument
        // نسترجعهم هون مباشرة
        // في المرحلة الأولى نرجع empty — الـ confirming يعمل بس مع ما هو متاح
        return SanctionRecordData.empty();
    }

    // ══════════════════════════════════════════
    //  buildMatchNotes — ملاحظات غنية للـ match
    // ══════════════════════════════════════════
    private String buildMatchNotes(MergedMatch merged) {
        StringBuilder sb = new StringBuilder();
        if (merged.notes != null && !merged.notes.isBlank()) {
            sb.append(merged.notes);
        }
        if (merged.confidenceLevel != null && !"UNCONFIRMED".equals(merged.confidenceLevel)) {
            if (sb.length() > 0) sb.append(" | ");
            sb.append("Confidence: ").append(merged.confidenceLevel);
        }
        if (merged.dobConfidence != null && !"UNAVAILABLE".equals(merged.dobConfidence)) {
            sb.append(" | DOB: ").append(merged.dobConfidence);
        }
        if (merged.idConfidence != null && !"UNAVAILABLE".equals(merged.idConfidence)) {
            sb.append(" | ID: ").append(merged.idConfidence);
        }
        return sb.length() > 0 ? sb.toString() : null;
    }

    // ══════════════════════════════════════════
    //  Merge Results
    // ══════════════════════════════════════════
    private List<MergedMatch> mergeResults(String query, List<SanctionSearchResult> results) {
        Map<String, MergedMatch> groups = new LinkedHashMap<>();

        for (SanctionSearchResult sr : results) {
            if (sr.getNameSimilarity() < 70.0) continue;

            String normName = SmartNameMatcher.normalize(sr.getName());
            String groupKey = findGroupKey(groups, normName);

            if (groupKey == null) {
                groupKey = normName;
                groups.put(groupKey, new MergedMatch(sr));
            } else {
                groups.get(groupKey).merge(sr);
            }
        }

        return groups.values().stream()
            .sorted((a, b) -> Double.compare(b.riskPoints, a.riskPoints))
            .collect(Collectors.toList());
    }

    private String findGroupKey(Map<String, MergedMatch> groups, String normName) {
        for (Map.Entry<String, MergedMatch> entry : groups.entrySet()) {
            double sim = SmartNameMatcher.match(entry.getKey(), normName, List.of());
            if (sim >= 65.0) return entry.getKey();
        }
        return null;
    }

    // ══════════════════════════════════════════
    //  MergedMatch — موسّع مع الـ confirming fields
    // ══════════════════════════════════════════
    private static class MergedMatch {
        String       name;
        List<String> sources = new ArrayList<>();
        double       bestScore;
        String       bestSanctionId;
        String       notes;
        String       wikidataId;
        double       maxWeight;
        double       riskPoints;
        boolean      isPep;
        String       confidenceLevel = "UNCONFIRMED";
        String       dobConfidence   = "UNAVAILABLE";
        String       idConfidence    = "UNAVAILABLE";

        MergedMatch(SanctionSearchResult sr) {
            this.name           = sr.getName();
            this.bestScore      = sr.getNameSimilarity();
            this.notes          = sr.getNotes();
            this.wikidataId     = sr.getWikidataId();
            this.isPep          = "PEP".equalsIgnoreCase(sr.getSource());
            this.maxWeight      = calcWeight(sr.getSource());
            this.bestSanctionId = (!this.isPep && sr.getId() != null)
                                  ? sr.getId().toString() : null;
            // الـ confirming fields
            this.confidenceLevel = sr.getConfidenceLevel();
            this.dobConfidence   = sr.getDobConfidence();
            this.idConfidence    = sr.getIdConfidence();

            if (!this.isPep) {
                sources.add(sr.getSource());
                this.riskPoints = calcRiskPoints(sr.getNameSimilarity(), this.maxWeight);
            } else {
                this.riskPoints = calcRiskPointsPep(sr.getNameSimilarity());
            }

            // CONFIRMED → رفع إضافي للـ riskPoints
            applyConfidenceBoostToRisk();
        }

        void merge(SanctionSearchResult sr) {
            if (sr.getNameSimilarity() > bestScore) {
                bestScore        = sr.getNameSimilarity();
                name             = sr.getName();
                confidenceLevel  = sr.getConfidenceLevel();
                dobConfidence    = sr.getDobConfidence();
                idConfidence     = sr.getIdConfidence();
            }
            if (sr.getId() != null && !isPep(sr.getSource())) {
                if (bestSanctionId == null || sr.getNameSimilarity() >= bestScore) {
                    bestSanctionId = sr.getId().toString();
                }
            }
            double w = calcWeight(sr.getSource());
            if (w > maxWeight) maxWeight = w;
            if ("PEP".equalsIgnoreCase(sr.getSource())) {
                isPep      = true;
                notes      = sr.getNotes()      != null ? sr.getNotes()      : notes;
                wikidataId = sr.getWikidataId() != null ? sr.getWikidataId() : wikidataId;
            } else if (!sources.contains(sr.getSource())) {
                sources.add(sr.getSource());
            }
            recalcRiskPoints();
        }

        // ══════════════════════════════════════
        //  applyConfidenceBoostToRisk
        //  CONFIRMED = +20% على الـ riskPoints
        //  PROBABLE  = +10%
        //  POSSIBLE  = +5%
        // ══════════════════════════════════════
        void applyConfidenceBoostToRisk() {
            double multiplier = switch (confidenceLevel != null ? confidenceLevel : "UNCONFIRMED") {
                case "CONFIRMED" -> 1.20;
                case "PROBABLE"  -> 1.10;
                case "POSSIBLE"  -> 1.05;
                default          -> 1.00;
            };
            riskPoints *= multiplier;
        }

        private static boolean isPep(String source) {
            return "PEP".equalsIgnoreCase(source);
        }

        void recalcRiskPoints() {
            if (!sources.isEmpty()) {
                riskPoints = calcRiskPoints(bestScore, maxWeight);
            } else if (isPep) {
                riskPoints = calcRiskPointsPep(bestScore);
            }
            applyConfidenceBoostToRisk();
        }

        String sourcesLabel() {
            String label = String.join(" | ", sources);
            if (isPep) label = label.isEmpty() ? "PEP" : label + " | PEP";
            return label.isEmpty() ? "UNKNOWN" : label;
        }

        static double calcWeight(String source) {
            return switch ((source != null ? source : "").toUpperCase()) {
                case "OFAC", "UN", "EU", "UK", "LOCAL" -> 1.5;
                case "PEP"                              -> 1.25;
                case "INTERPOL"                         -> 1.2;
                case "FATF", "WORLD_BANK"               -> 1.1;
                default                                 -> 1.0;
            };
        }

        static double calcRiskPoints(double sim, double weight) {
            if (sim <= 70.0) return 0.0;
            double base = ((sim - 70.0) / 30.0) * 100.0;
            return base * weight;
        }

        static double calcRiskPointsPep(double sim) {
            return (sim / 100.0) * 125.0;
        }
    }

    // ══════════════════════════════════════════
    //  History
    // ══════════════════════════════════════════
    public List<ScreeningResult> getHistory() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) return resultRepository.findAllByOrderByCreatedAtDesc();
        return resultRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    public List<ScreeningResult> getHistoryByUser(String username) {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) return resultRepository.findByCreatedByUsername(username);
        return resultRepository.findByCreatedByUsernameAndTenantId(username, tenantId);
    }

    // ══════════════════════════════════════════
    //  Auto-create Case
    // ══════════════════════════════════════════
    private void autoCreateCase(ScreeningResult result, String fullName,
                                 int matchCount, String username) {
        RiskLevel risk = result.getRiskLevel();
        if (risk == RiskLevel.VERY_LOW || risk == RiskLevel.LOW) return;
        try {
            CaseRequest caseReq = new CaseRequest();
            caseReq.setCaseType("PERSON");
            caseReq.setScreeningId(result.getId());
            caseReq.setSubjectName(fullName);
            caseReq.setPriority(mapRiskToPriority(risk));
            caseReq.setAssignedTo(null);
            String initialStatus = (risk == RiskLevel.CRITICAL) ? "ESCALATED" : "OPEN";
            caseReq.setNotes("Auto-created — Risk: " + risk
                + " | Matches: " + matchCount
                + " | Status: " + initialStatus);
            var createdCase = caseService.createCase(caseReq, username);
            if (risk == RiskLevel.CRITICAL) {
                caseService.updateStatus(createdCase.getId(),
                    "ESCALATED", "Auto-escalated due to CRITICAL risk", "system");
            }
            log.info("✅ Case #{} [{}] for '{}' — Risk: {}",
                createdCase.getId(), initialStatus, fullName, risk);
        } catch (Exception e) {
            log.warn("⚠️ Case not created for screening #{}: {}",
                result.getId(), e.getMessage());
        }
    }

    private String mapRiskToPriority(RiskLevel risk) {
        return switch (risk) {
            case CRITICAL -> "CRITICAL";
            case HIGH     -> "HIGH";
            case MEDIUM   -> "MEDIUM";
            default       -> "LOW";
        };
    }
}