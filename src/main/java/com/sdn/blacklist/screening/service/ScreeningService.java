package com.sdn.blacklist.screening.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sdn.blacklist.cases.dto.CaseRequest;
import com.sdn.blacklist.cases.service.CaseService;
import com.sdn.blacklist.common.dto.SanctionSearchResult;
import com.sdn.blacklist.common.dto.SanctionSearchResult.ConfirmingData;
import com.sdn.blacklist.common.dto.SanctionSearchResult.SanctionRecordData;
import com.sdn.blacklist.common.service.CountryRiskService;
import com.sdn.blacklist.common.service.RiskCalculator;
import com.sdn.blacklist.common.service.SanctionSearchService;
import com.sdn.blacklist.common.util.SmartNameMatcher;
import com.sdn.blacklist.entity.SanctionEntity;
import com.sdn.blacklist.notifications.NotificationService;
import com.sdn.blacklist.notifications.NotificationService.CaseNotification;
import com.sdn.blacklist.repository.SanctionRepository;
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
    private final SanctionRepository         sanctionRepository;
    private final NotificationService        notificationService; // ✅

    private static final ObjectMapper JSON = new ObjectMapper();

    public ScreeningService(ScreeningRequestRepository requestRepository,
                             ScreeningResultRepository  resultRepository,
                             ScreeningMatchRepository   matchRepository,
                             SanctionSearchService      sanctionSearchService,
                             CaseService                caseService,
                             RateLimitService           rateLimitService,
                             WebhookService             webhookService,
                             CountryRiskService         countryRiskService,
                             SanctionRepository         sanctionRepository,
                             NotificationService        notificationService) {
        this.requestRepository   = requestRepository;
        this.resultRepository    = resultRepository;
        this.matchRepository     = matchRepository;
        this.sanctionSearchService = sanctionSearchService;
        this.caseService         = caseService;
        this.rateLimitService    = rateLimitService;
        this.webhookService      = webhookService;
        this.countryRiskService  = countryRiskService;
        this.sanctionRepository  = sanctionRepository;
        this.notificationService = notificationService;
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

        log.info("🔍 Screening: '{}' | KYC: dob={} nat={} id={}",
            fullName,
            dob != null ? dob.getYear() : "—",
            nationality != null ? nationality : "—",
            idNumber != null ? "yes" : "no");

        String searchFullName   = fullName;
        String searchFullNameAr = fullNameAr;

        if (SmartNameMatcher.isArabic(fullName)) {
            searchFullNameAr = fullName;
            String translit = SmartNameMatcher.transliterate(
                SmartNameMatcher.normalizeAr(fullName));
            searchFullName = translit.isBlank() ? fullName : translit;
            log.info("🔀 Arabic input: '{}' → translit='{}'", fullName, searchFullName);
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
        log.info("⏱️ [1] DB save: {}ms", System.currentTimeMillis() - t1);

        // ── Search ────────────────────────────────────────────────────────────
        long t2 = System.currentTimeMillis();
        List<SanctionSearchResult> searchResults = new ArrayList<>(
            sanctionSearchService.search(searchFullName, 75.0, 0, 10));

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
        log.info("⏱️ [2] Search: {}ms | {} results",
            System.currentTimeMillis() - t2, searchResults.size());

        // ── Confirming factors (KYC) ──────────────────────────────────────────
        if (hasConfirmingData) applyConfirmingFactors(searchResults, confirmingData);

        // ── Merge + build matches ─────────────────────────────────────────────
        long t4 = System.currentTimeMillis();
        List<MergedMatch> mergedMatches = mergeResults(fullName, searchResults);
        int totalRiskPoints = 0;
        int maxSinglePoints = 0;

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
            match.setRiskPoints((double) merged.riskPoints);
            match.setPep(merged.isPep);
            result.addMatch(match);
            totalRiskPoints += merged.riskPoints;
            maxSinglePoints  = Math.max(maxSinglePoints, merged.riskPoints);

            log.info("📊 Match: '{}' | sources={} | level={} | confidence={} | pts={}",
                merged.name, merged.sourcesLabel(),
                merged.matchLevel, merged.confidenceLevel, merged.riskPoints);
        }
        log.info("⏱️ [4] Merge: {}ms | {} matches",
            System.currentTimeMillis() - t4, mergedMatches.size());

        // ── Country risk ──────────────────────────────────────────────────────
        long t5 = System.currentTimeMillis();
        double countryRiskScore = countryRiskService.getRiskScore(country);
        if (countryRiskScore > 0) {
            int crp = RiskCalculator.calcCountryRiskPoints(countryRiskScore);
            ScreeningMatch cm = new ScreeningMatch();
            cm.setMatchedName("Country Risk: " + country
                + " [" + countryRiskService.getRiskTier(country) + "]");
            cm.setSource("FATF");
            cm.setMatchScore(countryRiskScore);
            cm.setRiskPoints((double) crp);
            cm.setNotes("FATF " + countryRiskService.getRiskTier(country) + " — auto risk added");
            result.addMatch(cm);
            totalRiskPoints += crp;
            maxSinglePoints  = Math.max(maxSinglePoints, crp);
            log.info("🌍 Country risk [{}]: {} pts", country, crp);
        }
        log.info("⏱️ [5] Country risk: {}ms", System.currentTimeMillis() - t5);

        // ── Risk Level ────────────────────────────────────────────────────────
        RiskLevel riskLevel = toModelRiskLevel(
            RiskCalculator.resolveScreeningRisk(totalRiskPoints));
        result.setRiskLevel(riskLevel);
        result.setNotes(buildRiskNote(riskLevel));

        log.info("📊 Total pts: {} | maxSingle: {} | Risk: {}",
            totalRiskPoints, maxSinglePoints, riskLevel);

        // ── DB: Save result ───────────────────────────────────────────────────
        long t6 = System.currentTimeMillis();
        ScreeningResult saved = resultRepository.save(result);
        log.info("⏱️ [6] DB save result: {}ms", System.currentTimeMillis() - t6);

        // ── Async post-commit ─────────────────────────────────────────────────
        final ScreeningResult finalSaved    = saved;
        final String          finalFullName = fullName;
        final int             finalCount    = mergedMatches.size();
        final String          finalUsername = createdBy != null ? createdBy.getUsername() : "system";
        final RiskLevel       finalRisk     = saved.getRiskLevel();
        final Long            finalTenantId = tenantId;

        TransactionSynchronizationManager.registerSynchronization(
            new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    CompletableFuture.runAsync(() -> {
                        try {
                            TenantContext.setTenantId(finalTenantId);
                            doAutoCreateCase(finalSaved, finalFullName, finalCount, finalUsername);
                        } catch (Exception e) {
                            log.warn("⚠️ Async case creation failed: {}", e.getMessage());
                        } finally {
                            TenantContext.clear();
                        }
                    });
                    CompletableFuture.runAsync(() -> {
                        try {
                            if (finalRisk == RiskLevel.CRITICAL)
                                webhookService.trigger(finalTenantId,
                                    WebhookService.EVENT_SCREENING_CRITICAL,
                                    Map.of("personName", finalFullName,
                                           "riskLevel", "CRITICAL",
                                           "screeningId", finalSaved.getId()));
                            else if (finalRisk == RiskLevel.HIGH)
                                webhookService.trigger(finalTenantId,
                                    WebhookService.EVENT_SCREENING_HIGH,
                                    Map.of("personName", finalFullName,
                                           "riskLevel", "HIGH",
                                           "screeningId", finalSaved.getId()));
                        } catch (Exception e) {
                            log.warn("⚠️ Async webhook failed: {}", e.getMessage());
                        }
                    });
                }
            });

        log.info("⏱️ [TOTAL] Screening '{}': {}ms | Risk: {}",
            fullName, System.currentTimeMillis() - T0, saved.getRiskLevel());

        return saved;
    }

    // ══════════════════════════════════════════
    //  KYC — applyConfirmingFactors
    // ══════════════════════════════════════════
    private void applyConfirmingFactors(List<SanctionSearchResult> results,
                                         ConfirmingData input) {
        for (SanctionSearchResult r : results) {
            SanctionRecordData data = extractSanctionData(r);
            r.applyConfirmingFactors(input, data);
            log.info("🔎 KYC [{}]: sanctionDOB={} inputDOB={} → dobResult={} confidence={}",
                r.getName(),
                data.dob != null ? data.dob.getYear() : "—",
                input.dob  != null ? input.dob.getYear()  : "—",
                r.getDobConfidence(),
                r.getConfidenceLevel());
        }
    }

    // ══════════════════════════════════════════
    //  extractSanctionData
    // ══════════════════════════════════════════
    private SanctionRecordData extractSanctionData(SanctionSearchResult result) {
        if (result.getId() == null) return SanctionRecordData.empty();
        try {
            UUID uuid  = result.getId();
            String src = result.getSource();

            SanctionEntity entity = src != null
                ? sanctionRepository.findByUuidAndSource(uuid, src.toUpperCase())
                    .orElseGet(() -> sanctionRepository.findById(uuid).orElse(null))
                : sanctionRepository.findById(uuid).orElse(null);

            if (entity == null) return SanctionRecordData.empty();

            LocalDate dob        = parseDob(entity);
            String    nationality = parseNationality(entity);
            String    idNumber    = "LOCAL".equalsIgnoreCase(src) ? parseIdNumber(entity) : null;

            return new SanctionRecordData(nationality, dob, idNumber);

        } catch (Exception e) {
            log.debug("extractSanctionData failed for {}: {}", result.getName(), e.getMessage());
            return SanctionRecordData.empty();
        }
    }

    // ══════════════════════════════════════════
    //  parseDob
    // ══════════════════════════════════════════
    private LocalDate parseDob(SanctionEntity entity) {
        try {
            Object raw = entity.getDateOfBirth();
            if (raw == null) return null;
            String dobStr = raw.toString().trim();
            if (dobStr.isBlank() || dobStr.equals("null") || dobStr.equals("[]")) return null;

            JsonNode node  = JSON.readTree(dobStr);
            JsonNode first = node.isArray() && node.size() > 0 ? node.get(0) : node;

            if (first.isObject()) {
                int year  = first.path("year").asInt(0);
                int month = Math.max(1, Math.min(first.path("month").asInt(1), 12));
                int day   = Math.max(1, Math.min(first.path("day").asInt(1), 28));
                if (year > 1900 && year < 2100)
                    return LocalDate.of(year, month, day);
            }

            String text = first.isTextual() ? first.asText() : first.toString();
            return extractYearFromText(text);

        } catch (Exception e) {
            log.debug("parseDob failed: {}", e.getMessage());
            return null;
        }
    }

    private LocalDate extractYearFromText(String text) {
        if (text == null || text.isBlank()) return null;
        text = text.replaceAll("[\"\\[\\]]", "").trim();
        try {
            if (text.length() >= 10 && text.charAt(4) == '-')
                return LocalDate.parse(text.substring(0, 10));
        } catch (Exception ignored) {}
        Matcher m = Pattern.compile("\\b(19|20)\\d{2}\\b").matcher(text);
        if (m.find())
            return LocalDate.of(Integer.parseInt(m.group()), 1, 1);
        return null;
    }

    // ══════════════════════════════════════════
    //  parseNationality
    // ══════════════════════════════════════════
    private String parseNationality(SanctionEntity entity) {
        try {
            Object raw = entity.getCountry();
            if (raw == null) return null;
            String natStr = raw.toString().trim();
            if (natStr.isBlank() || natStr.equals("null") || natStr.equals("[]")) return null;
            JsonNode node  = JSON.readTree(natStr);
            JsonNode first = node.isArray() && node.size() > 0 ? node.get(0) : node;
            if (first.isObject()) {
                String c = first.path("country").asText(null);
                if (c == null) c = first.path("nationality").asText(null);
                return c;
            }
            if (first.isTextual()) return first.asText();
            return null;
        } catch (Exception e) { return null; }
    }

    // ══════════════════════════════════════════
    //  parseIdNumber
    // ══════════════════════════════════════════
    private String parseIdNumber(SanctionEntity entity) {
        try {
            Object raw = entity.getIds();
            if (raw == null) return null;
            String idsStr = raw.toString().trim();
            if (idsStr.isBlank() || idsStr.equals("null") || idsStr.equals("[]")) return null;
            JsonNode node = JSON.readTree(idsStr);
            if (node.isArray()) {
                for (JsonNode item : node) {
                    String idNum = item.path("idNumber").asText(null);
                    if (idNum != null && !idNum.isBlank()) return idNum;
                    idNum = item.path("number").asText(null);
                    if (idNum != null && !idNum.isBlank()) return idNum;
                }
            }
            return null;
        } catch (Exception e) { return null; }
    }

    // ══════════════════════════════════════════
    //  Helpers
    // ══════════════════════════════════════════
    private static RiskLevel toModelRiskLevel(RiskCalculator.RiskLevel calcLevel) {
        return switch (calcLevel) {
            case VERY_LOW -> RiskLevel.VERY_LOW;
            case LOW      -> RiskLevel.LOW;
            case MEDIUM   -> RiskLevel.MEDIUM;
            case HIGH     -> RiskLevel.HIGH;
            case CRITICAL -> RiskLevel.CRITICAL;
        };
    }

    private static String buildRiskNote(RiskLevel level) {
        return switch (level) {
            case VERY_LOW -> "No match — Auto APPROVED";
            case LOW      -> "Possible match — Auto APPROVED with log";
            case MEDIUM   -> "Probable match — Requires review";
            case HIGH     -> "Strong match — Requires senior review";
            case CRITICAL -> "Auto BLOCKED — Immediate action required";
        };
    }

    private String buildMatchNotes(MergedMatch merged) {
        StringBuilder sb = new StringBuilder();
        if (merged.notes != null && !merged.notes.isBlank()) sb.append(merged.notes);
        if (!"UNCONFIRMED".equals(merged.confidenceLevel)) {
            if (sb.length() > 0) sb.append(" | ");
            sb.append("Confidence: ").append(merged.confidenceLevel);
        }
        if (!"UNAVAILABLE".equals(merged.dobConfidence))
            sb.append(" | DOB: ").append(merged.dobConfidence);
        if (!"UNAVAILABLE".equals(merged.idConfidence))
            sb.append(" | ID: ").append(merged.idConfidence);
        sb.append(" | Match: ").append(merged.matchLevel);
        return sb.length() > 0 ? sb.toString() : null;
    }

    // ══════════════════════════════════════════
    //  Merge Results
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
            .sorted((a, b) -> Integer.compare(b.riskPoints, a.riskPoints))
            .collect(Collectors.toList());
    }

    private String findGroupKey(Map<String, MergedMatch> groups,
                                 String normName, double sim) {
        for (Map.Entry<String, MergedMatch> entry : groups.entrySet()) {
            double nameSim = SmartNameMatcher.match(entry.getKey(), normName, List.of());
            if (nameSim >= 80.0)
                return entry.getKey();
            if (nameSim >= 65.0 && hasSharedToken(entry.getKey(), normName))
                return entry.getKey();
            if (isDifferentScript(entry.getKey(), normName)
                    && sim >= 78.0 && entry.getValue().bestScore >= 78.0
                    && hasSharedToken(entry.getKey(), normName))
                return entry.getKey();
        }
        return null;
    }

    private static boolean hasSharedToken(String a, String b) {
        List<String> tA = SmartNameMatcher.tokenize(a).stream()
            .filter(t -> t.length() >= 3 && !isStopword(t)).toList();
        List<String> tB = SmartNameMatcher.tokenize(b).stream()
            .filter(t -> t.length() >= 3 && !isStopword(t)).toList();
        if (tA.isEmpty() || tB.isEmpty()) return false;
        return tA.stream().anyMatch(ta ->
            tB.stream().anyMatch(tb ->
                SmartNameMatcher.levenshteinSimilarity(ta, tb) >= 75.0));
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
        String             name;
        List<String>       sources   = new ArrayList<>();
        double             bestScore;
        String             bestSource;
        SmartNameMatcher.MatchLevel matchLevel;
        String             bestSanctionId;
        Map<String,String> sourceIds = new LinkedHashMap<>();
        String             notes, wikidataId;
        double             maxWeight;
        int                riskPoints;
        boolean            isPep;
        String             confidenceLevel = "UNCONFIRMED";
        String             dobConfidence   = "UNAVAILABLE";
        String             idConfidence    = "UNAVAILABLE";

        MergedMatch(SanctionSearchResult sr) {
            name            = sr.getName();
            bestScore       = sr.getNameSimilarity();
            bestSource      = sr.getSource();
            matchLevel      = SmartNameMatcher.classifyScore(bestScore);
            notes           = sr.getNotes();
            wikidataId      = sr.getWikidataId();
            isPep           = "PEP".equalsIgnoreCase(sr.getSource());
            maxWeight       = RiskCalculator.listWeight(sr.getSource());
            bestSanctionId  = (!isPep && sr.getId() != null) ? sr.getId().toString() : null;
            if (!isPep && sr.getId() != null && sr.getSource() != null)
                storeId(sr.getSource(), sr.getId().toString());
            confidenceLevel = sr.getConfidenceLevel();
            dobConfidence   = sr.getDobConfidence();
            idConfidence    = sr.getIdConfidence();
            riskPoints = !isPep
                ? RiskCalculator.calcNameRiskPoints(bestScore, bestSource)
                : RiskCalculator.calcNameRiskPoints(bestScore, "PEP");
            riskPoints = (int) RiskCalculator.applyConfidenceBoost(riskPoints, confidenceLevel);
            if (!isPep) sources.add(sr.getSource());
        }

        void merge(SanctionSearchResult sr) {
            double w = RiskCalculator.listWeight(sr.getSource());
            if (sr.getNameSimilarity() > bestScore) {
                bestScore       = sr.getNameSimilarity();
                name            = sr.getName();
                matchLevel      = SmartNameMatcher.classifyScore(bestScore);
                confidenceLevel = sr.getConfidenceLevel();
                dobConfidence   = sr.getDobConfidence();
                idConfidence    = sr.getIdConfidence();
            }
            if (w > maxWeight) { maxWeight = w; bestSource = sr.getSource(); }
            if (sr.getId() != null && !isPepSrc(sr.getSource())) {
                if (bestSanctionId == null || sr.getNameSimilarity() >= bestScore)
                    bestSanctionId = sr.getId().toString();
                if (sr.getSource() != null) storeId(sr.getSource(), sr.getId().toString());
            }
            if ("PEP".equalsIgnoreCase(sr.getSource())) {
                isPep      = true;
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

        private static boolean isPepSrc(String s) { return "PEP".equalsIgnoreCase(s); }

        void recalc() {
            int sanctionPts = !sources.isEmpty()
                ? RiskCalculator.calcNameRiskPoints(bestScore, bestSource) : 0;
            int pepPts = isPep
                ? RiskCalculator.calcNameRiskPoints(bestScore, "PEP") : 0;
            riskPoints = sanctionPts > 0
                ? sanctionPts + (int)(pepPts * 0.5) : pepPts;
            riskPoints = (int) RiskCalculator.applyConfidenceBoost(riskPoints, confidenceLevel);
        }

        String sourcesLabel() {
            String lbl = String.join(" | ", sources);
            if (isPep) lbl = lbl.isEmpty() ? "PEP" : lbl + " | PEP";
            return lbl.isEmpty() ? "UNKNOWN" : lbl;
        }
    }

    // ══════════════════════════════════════════
    //  Auto-create Case
    //
    //  ✅ أضفنا إشعار للموظف لـ MEDIUM وHIGH
    //  قبل: بس CRITICAL كان يوصله إشعار
    //       (عبر updateStatus بـ "system")
    //  هلأ: كل risk levels تبعث إشعار للموظف
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
            req.setAssignedTo(username);
            req.setNotes("Auto-created — Risk: " + risk
                + " | Matches: " + matchCount
                + " | Status: " + (risk == RiskLevel.CRITICAL ? "ESCALATED" : "OPEN"));

            var created = caseService.createCase(req, username);

            // ✅ أبلغ الموظف — بس للـ MEDIUM وHIGH
            // الـ CRITICAL بياخذ إشعاره من updateStatus تحت
            if (risk == RiskLevel.MEDIUM || risk == RiskLevel.HIGH) {
                String msg = risk == RiskLevel.HIGH
                    ? "⚠️ تنبيه عالي: تم رفع حالة للمراجعة — " + fullName
                    : "تم إنشاء حالة تحتاج مراجعة — " + fullName;
                try {
                    notificationService.sendToUser(username, new CaseNotification(
                        created.getId(),
                        created.getReference(),
                        fullName,
                        created.getStatus(),
                        null,
                        "NEW_CASE",
                        "system",
                        msg
                    ));
                } catch (Exception e) {
                    log.warn("⚠️ Employee notification failed: {}", e.getMessage());
                }
            }

            if (risk == RiskLevel.CRITICAL)
                caseService.updateStatus(created.getId(),
                    "ESCALATED", "Auto-escalated due to CRITICAL risk", "system");

            log.info("✅ Case #{} for '{}' — {} assigned to '{}'",
                created.getId(), fullName, risk, username);

        } catch (Exception e) {
            log.warn("⚠️ Case not created for '{}': {}", fullName, e.getMessage());
        }
    }

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