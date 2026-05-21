package com.sdn.blacklist.transfer.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sdn.blacklist.cases.dto.CaseRequest;
import com.sdn.blacklist.cases.service.CaseService;
import com.sdn.blacklist.common.dto.SanctionSearchResult;
import com.sdn.blacklist.common.service.CountryRiskService;
import com.sdn.blacklist.common.service.SanctionSearchService;
import com.sdn.blacklist.tenant.context.TenantContext;
import com.sdn.blacklist.tenant.service.RateLimitService;
import com.sdn.blacklist.transfer.dto.TransferScreeningRequest;
import com.sdn.blacklist.transfer.dto.TransferScreeningResponse;
import com.sdn.blacklist.transfer.dto.TransferStatsResponse;
import com.sdn.blacklist.transfer.entity.TransferScreeningMatch;
import com.sdn.blacklist.transfer.entity.TransferScreeningRecord;
import com.sdn.blacklist.transfer.entity.TransferScreeningRecord.RiskLevel;
import com.sdn.blacklist.transfer.entity.TransferScreeningRecord.ScreeningAction;
import com.sdn.blacklist.transfer.repository.TransferScreeningRepository;
import com.sdn.blacklist.webhook.service.WebhookService;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransferScreeningService {

    private final SanctionSearchService       sanctionSearchService;
    private final TransferScreeningRepository repository;
    private final CaseService                 caseService;
    private final RateLimitService            rateLimitService;
    private final WebhookService              webhookService;
    private final CountryRiskService          countryRiskService;

    // ══════════════════════════════════════════
    //  Risk Thresholds
    //  points = ((sim-70)/30) × 100 × weight
    //
    //  sim=100% OFAC(×1.5) → 150 pts → BLOCK
    //  sim=90%  OFAC(×1.5) → 100 pts → BLOCK
    //  sim=85%  OFAC(×1.5) →  75 pts → REVIEW
    //  sim=80%  DEFAULT    →  33 pts → APPROVE
    // ══════════════════════════════════════════
    private static final int APPROVE_MAX = 40;   // <= 40  → APPROVE
    private static final int REVIEW_MAX  = 99;   // 41-99  → REVIEW   ✅ إصلاح: كان 149
    // >= 100 → BLOCK

    private final AtomicLong refCounter = new AtomicLong(0);

    @PostConstruct
    public void initCounter() {
        long maxSeq = repository.findMaxSequence();
        refCounter.set(maxSeq);
        log.info("✅ Reference counter initialized to: {}", maxSeq);
    }

    @Transactional
    public TransferScreeningResponse screen(TransferScreeningRequest req) {
        long start = System.currentTimeMillis();

        // ── بحث الـ sender والـ receiver ──
        List<SanctionSearchResult> senderMatches   = searchBothNames(req.getSenderName(),   req.getSenderNameAr());
        List<SanctionSearchResult> receiverMatches = searchBothNames(req.getReceiverName(), req.getReceiverNameAr());

        // ── حساب النقاط ──
        // كل طرف يحسب على حدى — نأخذ أعلى match لكل طرف ثم نجمع
        int senderPoints   = calcPoints(senderMatches,   "SENDER");
        int receiverPoints = calcPoints(receiverMatches, "RECEIVER");
        int totalPoints    = senderPoints + receiverPoints;

        // ── Country Risk ──
        double countryRiskScore = countryRiskService.getRiskScore(req.getCountry());
        if (countryRiskScore > 0) {
            int countryRiskPoints = (int) Math.round(countryRiskScore * 0.5);
            totalPoints += countryRiskPoints;
            log.info("🌍 Country risk [{}]: +{} points", req.getCountry(), countryRiskPoints);
        }

        // ── Action + Risk Level ──
        ScreeningAction action    = resolveAction(totalPoints);
        RiskLevel       riskLevel = resolveRiskLevel(totalPoints);
        String          reason    = buildReason(action, senderMatches, receiverMatches, totalPoints);
        long            procMs    = System.currentTimeMillis() - start;
        Long            tenantId  = TenantContext.getTenantId();

        rateLimitService.countRequest();

        // ── Match Entities ──
        List<TransferScreeningMatch> matchEntities = new ArrayList<>();
        senderMatches.forEach(m   -> matchEntities.add(toMatchEntity(m, TransferScreeningMatch.Party.SENDER)));
        receiverMatches.forEach(m -> matchEntities.add(toMatchEntity(m, TransferScreeningMatch.Party.RECEIVER)));

        if (countryRiskScore > 0) {
            matchEntities.add(TransferScreeningMatch.builder()
                .party(TransferScreeningMatch.Party.SENDER)
                .matchedName("Country Risk: " + req.getCountry()
                    + " [" + countryRiskService.getRiskTier(req.getCountry()) + "]")
                .source("FATF")
                .score(countryRiskScore)
                .build());
        }

        // ── Build Record ──
        String createdBy = (req.getCreatedBy() != null && !req.getCreatedBy().isBlank())
            ? req.getCreatedBy() : getUsername();

        TransferScreeningRecord record = TransferScreeningRecord.builder()
            .reference(generateReference())
            .senderName(req.getSenderName())     .senderNameAr(req.getSenderNameAr())
            .receiverName(req.getReceiverName()) .receiverNameAr(req.getReceiverNameAr())
            .country(req.getCountry())           .amount(req.getAmount())
            .currency(req.getCurrency())
            .action(action).riskLevel(riskLevel).riskPoints(totalPoints)
            .reason(reason).processingMs(procMs)
            .createdBy(createdBy).tenantId(tenantId)
            .operatorId(req.getOperatorId()).operatorName(req.getOperatorName())
            .build();

        matchEntities.forEach(m -> m.setScreening(record));
        record.setMatches(matchEntities);

        TransferScreeningRecord saved = repository.save(record);

        log.info("✅ Transfer [{}] → {} | Risk:{} | Points:{}(S:{}+R:{}) | {}ms | tenant:{}",
            saved.getReference(), action, riskLevel, totalPoints,
            senderPoints, receiverPoints, procMs, tenantId);

        // ── Auto Case ──
        autoCreateCase(saved, senderMatches.size() + receiverMatches.size());

        // ── Webhook ──
        if (saved.getRiskLevel() == RiskLevel.HIGH || saved.getRiskLevel() == RiskLevel.CRITICAL) {
            webhookService.trigger(tenantId, WebhookService.EVENT_TRANSFER_HIGH,
                Map.of(
                    "reference",    saved.getReference(),
                    "riskLevel",    saved.getRiskLevel().name(),
                    "action",       saved.getAction().name(),
                    "transferId",   saved.getId(),
                    "senderName",   saved.getSenderName(),
                    "receiverName", saved.getReceiverName()
                ));
        }

        return toResponse(saved);
    }

    // ══════════════════════════════════════════
    //  calcPoints
    //  - بنأخذ أعلى match لكل طرف (مش sum لنفس الطرف)
    //  - لأن نفس الشخص مش لازم يُعاقب مرتين
    //  - بس السبب والمُرسَل إليه يُجمعان
    // ══════════════════════════════════════════
    private int calcPoints(List<SanctionSearchResult> matches, String party) {
        if (matches == null || matches.isEmpty()) return 0;

        return matches.stream()
            .filter(m -> m.getScore() >= 70.0)
            .mapToInt(m -> {
                // weight حسب المصدر
                double weight = calcWeight(m.getSource());
                // نفس فلسفة ScreeningService
                double base   = ((m.getScore() - 70.0) / 30.0) * 100.0;
                int    points = (int) Math.round(base * weight);

                log.info("📊 [{}] Match: name='{}' score={:.1f}% source={} weight={} → {} pts",
                    party, m.getName(), m.getScore(), m.getSource(), weight, points);

                return points;
            })
            .max()       // أعلى match لهذا الطرف فقط
            .orElse(0);
    }

    private static double calcWeight(String source) {
        return switch ((source != null ? source : "").toUpperCase()) {
            case "OFAC", "UN", "EU", "UK", "LOCAL" -> 1.5;
            case "PEP"                              -> 1.25;
            case "INTERPOL"                         -> 1.2;
            case "FATF", "WORLD_BANK"               -> 1.1;
            default                                 -> 1.0;
        };
    }

    // ══════════════════════════════════════════
    //  resolveAction — متوافق مع الـ thresholds
    //  APPROVE:  0  – 40  pts
    //  REVIEW:   41 – 99  pts
    //  BLOCK:    >= 100   pts
    // ══════════════════════════════════════════
    private ScreeningAction resolveAction(int points) {
        if (points <= APPROVE_MAX) return ScreeningAction.APPROVE;
        if (points <= REVIEW_MAX)  return ScreeningAction.REVIEW;
        return ScreeningAction.BLOCK;
    }

    // ══════════════════════════════════════════
    //  resolveRiskLevel — متوافق مع resolveAction
    //  VERY_LOW: 0
    //  LOW:      1  – 40   (APPROVE zone)
    //  MEDIUM:   41 – 99   (REVIEW zone)
    //  HIGH:     100 – 149 (BLOCK zone)
    //  CRITICAL: >= 150    (BLOCK zone — multi-source أو sim=100% OFAC)
    // ══════════════════════════════════════════
    private RiskLevel resolveRiskLevel(int points) {
        if (points == 0)   return RiskLevel.VERY_LOW;
        if (points <= 40)  return RiskLevel.LOW;
        if (points <= 99)  return RiskLevel.MEDIUM;
        if (points <= 149) return RiskLevel.HIGH;
        return RiskLevel.CRITICAL;
    }

    // ══════════════════════════════════════════
    //  searchBothNames
    //  بيبحث بالإنجليزي والعربي ويمنع التكرار
    // ══════════════════════════════════════════
    private List<SanctionSearchResult> searchBothNames(String nameEn, String nameAr) {
        List<SanctionSearchResult> results = new ArrayList<>();

        if (nameEn != null && !nameEn.isBlank())
            results.addAll(sanctionSearchService.search(nameEn, 70.0, 0, 10));

        if (nameAr != null && !nameAr.isBlank()) {
            // ✅ منع التكرار بالـ ID
            List<UUID> existingIds = results.stream()
                .map(SanctionSearchResult::getId)
                .collect(Collectors.toList());
            sanctionSearchService.search(nameAr, 70.0, 0, 10).stream()
                .filter(r -> r.getId() != null && !existingIds.contains(r.getId()))
                .forEach(results::add);
        }

        return results;
    }

    // ══════════════════════════════════════════
    //  buildReason
    // ══════════════════════════════════════════
    private String buildReason(ScreeningAction action,
                               List<SanctionSearchResult> senderMatches,
                               List<SanctionSearchResult> receiverMatches,
                               int totalPoints) {
        if (action == ScreeningAction.APPROVE)
            return "No sanctions matches found. Transfer cleared.";

        StringBuilder sb = new StringBuilder();
        if (!senderMatches.isEmpty())
            sb.append("Sender matched ").append(senderMatches.size()).append(" sanction record(s). ");
        if (!receiverMatches.isEmpty())
            sb.append("Receiver matched ").append(receiverMatches.size()).append(" sanction record(s). ");
        sb.append("Total risk points: ").append(totalPoints).append(".");
        return sb.toString();
    }

    // ══════════════════════════════════════════
    //  Auto-create Case
    // ══════════════════════════════════════════
    private void autoCreateCase(TransferScreeningRecord saved, int matchCount) {
        if (saved.getAction() == ScreeningAction.APPROVE) return;
        try {
            String subjectName = saved.getSenderName() + " → " + saved.getReceiverName();
            CaseRequest caseReq = new CaseRequest();
            caseReq.setCaseType("TRANSFER");
            caseReq.setScreeningId(saved.getId());
            caseReq.setSubjectName(subjectName);
            caseReq.setPriority(mapActionToPriority(saved.getAction(), saved.getRiskLevel()));
            caseReq.setAssignedTo(null);

            String operatorInfo = saved.getOperatorName() != null
                ? " | Operator: " + saved.getOperatorName() : "";
            caseReq.setNotes("Auto-created — Action: " + saved.getAction()
                + " | Risk: " + saved.getRiskLevel()
                + " | Points: " + saved.getRiskPoints()
                + " | Matches: " + matchCount
                + " | Ref: " + saved.getReference()
                + operatorInfo);

            var createdCase = caseService.createCase(caseReq, getUsername());

            if (saved.getAction() == ScreeningAction.BLOCK) {
                caseService.updateStatus(createdCase.getId(),
                    "ESCALATED", "Auto-escalated due to BLOCK action", "system");
            }

            log.info("✅ Case #{} created for transfer [{}]", createdCase.getId(), saved.getReference());

        } catch (Exception e) {
            log.warn("⚠️ Case not created for transfer {}: {}", saved.getReference(), e.getMessage());
        }
    }

    private String mapActionToPriority(ScreeningAction action, RiskLevel risk) {
        if (action == ScreeningAction.BLOCK) return "CRITICAL";
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
    public Page<TransferScreeningResponse> getHistory(int page, int size) {
        return repository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size))
            .map(this::toResponse);
    }

    public Page<TransferScreeningResponse> getHistoryByTenant(Long tenantId, int page, int size) {
        return repository.findByTenantIdOrderByCreatedAtDesc(tenantId, PageRequest.of(page, size))
            .map(this::toResponse);
    }

    public Page<TransferScreeningResponse> getHistoryByUser(String username, int page, int size) {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null)
            return repository.findByCreatedByOrderByCreatedAtDesc(username, PageRequest.of(page, size))
                .map(this::toResponse);
        return repository.findByCreatedByAndTenantIdOrderByCreatedAtDesc(
            username, tenantId, PageRequest.of(page, size)).map(this::toResponse);
    }

    // ══════════════════════════════════════════
    //  Stats
    // ══════════════════════════════════════════
    public TransferStatsResponse getStats() {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        return buildStats(
            repository.count(),
            repository.countByAction(ScreeningAction.APPROVE),
            repository.countByAction(ScreeningAction.REVIEW),
            repository.countByAction(ScreeningAction.BLOCK),
            repository.countToday(start, start.plusDays(1))
        );
    }

    public TransferStatsResponse getStatsByTenant(Long tenantId) {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        return buildStats(
            repository.countByTenantId(tenantId),
            repository.countByActionAndTenantId(ScreeningAction.APPROVE, tenantId),
            repository.countByActionAndTenantId(ScreeningAction.REVIEW,  tenantId),
            repository.countByActionAndTenantId(ScreeningAction.BLOCK,   tenantId),
            repository.countTodayByTenant(tenantId, start, start.plusDays(1))
        );
    }

    public TransferStatsResponse getStatsByUser(String username) {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        return buildStats(
            repository.countByCreatedBy(username),
            repository.countByCreatedByAndAction(username, ScreeningAction.APPROVE),
            repository.countByCreatedByAndAction(username, ScreeningAction.REVIEW),
            repository.countByCreatedByAndAction(username, ScreeningAction.BLOCK),
            repository.countTodayByUser(username, start, start.plusDays(1))
        );
    }

    private TransferStatsResponse buildStats(long total, long approved,
                                              long reviewed, long blocked, long today) {
        return TransferStatsResponse.builder()
            .total(total).approved(approved).reviewed(reviewed).blocked(blocked).today(today)
            .blockRate(total  > 0 ? (double) blocked  / total * 100 : 0)
            .reviewRate(total > 0 ? (double) reviewed / total * 100 : 0)
            .build();
    }

    // ══════════════════════════════════════════
    //  Getters
    // ══════════════════════════════════════════
    public TransferScreeningResponse getById(Long id) {
        TransferScreeningRecord r = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Screening not found: " + id));
        Long tenantId = TenantContext.getTenantId();
        if (tenantId != null && !tenantId.equals(r.getTenantId()))
            throw new RuntimeException("Access denied");
        return toResponse(r);
    }

    public TransferScreeningResponse getByReference(String reference) {
        return repository.findByReference(reference).map(this::toResponse)
            .orElseThrow(() -> new RuntimeException("Screening not found: " + reference));
    }

    // ══════════════════════════════════════════
    //  Mapping Helpers
    // ══════════════════════════════════════════
    private TransferScreeningMatch toMatchEntity(SanctionSearchResult m,
                                                  TransferScreeningMatch.Party party) {
        return TransferScreeningMatch.builder()
            .party(party).matchedName(m.getName())
            .source(m.getSource()).score(m.getScore())
            .build();
    }

    private TransferScreeningResponse toResponse(TransferScreeningRecord r) {
        List<TransferScreeningResponse.MatchDTO> matchDTOs = Collections.emptyList();
        if (r.getMatches() != null) {
            matchDTOs = r.getMatches().stream()
                .map(m -> TransferScreeningResponse.MatchDTO.builder()
                    .party(m.getParty().name()).matchedName(m.getMatchedName())
                    .source(m.getSource()).score(m.getScore())
                    .entityType(m.getEntityType()).country(m.getCountry())
                    .sanctionId(m.getSanctionId()).build())
                .collect(Collectors.toList());
        }
        return TransferScreeningResponse.builder()
            .id(r.getId()).reference(r.getReference())
            .senderName(r.getSenderName()).receiverName(r.getReceiverName())
            .country(r.getCountry()).amount(r.getAmount()).currency(r.getCurrency())
            .action(r.getAction()).riskLevel(r.getRiskLevel()).riskPoints(r.getRiskPoints())
            .reason(r.getReason()).processingMs(r.getProcessingMs())
            .matches(matchDTOs).createdAt(r.getCreatedAt()).createdBy(r.getCreatedBy())
            .operatorId(r.getOperatorId()).operatorName(r.getOperatorName())
            .build();
    }

    private String generateReference() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return String.format("SCR-%s-%05d", date, refCounter.incrementAndGet());
    }

    private String getUsername() {
        try { return SecurityContextHolder.getContext().getAuthentication().getName(); }
        catch (Exception e) { return "system"; }
    }
}