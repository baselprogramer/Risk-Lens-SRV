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
    private final RateLimitService rateLimitService;
    private final WebhookService              webhookService;
    private final CountryRiskService countryRiskService;



    private static final int APPROVE_MAX = 40;
    private static final int REVIEW_MAX  = 149;

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

        List<SanctionSearchResult> senderMatches   = searchBothNames(req.getSenderName(),   req.getSenderNameAr());
        List<SanctionSearchResult> receiverMatches = searchBothNames(req.getReceiverName(), req.getReceiverNameAr());

        int             totalPoints   = calcPoints(senderMatches) + calcPoints(receiverMatches);
        double countryRiskScore = countryRiskService.getRiskScore(req.getCountry());
            if (countryRiskScore > 0) {
                int countryRiskPoints = (int) Math.round(countryRiskScore * 0.5);
                totalPoints += countryRiskPoints;
                log.info("🌍 Country risk [{}]: +{} points", req.getCountry(), countryRiskPoints);
            }
        ScreeningAction action        = resolveAction(totalPoints);
        RiskLevel       riskLevel     = resolveRiskLevel(totalPoints);
        String          reason        = buildReason(action, senderMatches, receiverMatches, totalPoints);
        long            processingMs  = System.currentTimeMillis() - start;
        Long            tenantId      = TenantContext.getTenantId();

        rateLimitService.countRequest(); 


        List<TransferScreeningMatch> matchEntities = new ArrayList<>();
        senderMatches.forEach(m   -> matchEntities.add(toMatchEntity(m, TransferScreeningMatch.Party.SENDER)));
        receiverMatches.forEach(m -> matchEntities.add(toMatchEntity(m, TransferScreeningMatch.Party.RECEIVER)));

        if (countryRiskScore > 0) {
            TransferScreeningMatch countryMatch = TransferScreeningMatch.builder()
                .party(TransferScreeningMatch.Party.SENDER) // أو GENERAL لو عندك
                .matchedName("Country Risk: " + req.getCountry()
                    + " [" + countryRiskService.getRiskTier(req.getCountry()) + "]")
                .source("FATF")
                .score(countryRiskScore)
                .build();
            matchEntities.add(countryMatch);
                }


        //  createdBy: من الـ request (لو البرنامج المالي بعته) أو من الـ JWT
        String createdBy = (req.getCreatedBy() != null && !req.getCreatedBy().isBlank())
            ? req.getCreatedBy() : getUsername();

        TransferScreeningRecord record = TransferScreeningRecord.builder()
            .reference(generateReference())
            .senderName(req.getSenderName()).senderNameAr(req.getSenderNameAr())
            .receiverName(req.getReceiverName()).receiverNameAr(req.getReceiverNameAr())
            .country(req.getCountry()).amount(req.getAmount()).currency(req.getCurrency())
            .action(action).riskLevel(riskLevel).riskPoints(totalPoints)
            .reason(reason).processingMs(processingMs)
            .createdBy(createdBy)
            .tenantId(tenantId)
            .operatorId(req.getOperatorId())       //  من البرنامج المالي
            .operatorName(req.getOperatorName())   //  من البرنامج المالي
            .build();

        matchEntities.forEach(m -> m.setScreening(record));
        record.setMatches(matchEntities);

        TransferScreeningRecord saved = repository.save(record);
        log.info("✅ Transfer [{}] → {} | Risk:{} | Points:{} | {}ms | tenant:{} | operator:{}",
            saved.getReference(), action, riskLevel, totalPoints, processingMs,
            tenantId, req.getOperatorId());

        autoCreateCase(saved, senderMatches.size() + receiverMatches.size());

        if (saved.getRiskLevel() == RiskLevel.HIGH ||
    saved.getRiskLevel() == RiskLevel.CRITICAL) {
    webhookService.trigger(tenantId,
        WebhookService.EVENT_TRANSFER_HIGH,
        Map.of(
            "reference",   saved.getReference(),
            "riskLevel",   saved.getRiskLevel().name(),
            "action",      saved.getAction().name(),
            "transferId",  saved.getId(),
            "senderName",  saved.getSenderName(),
            "receiverName",saved.getReceiverName()
        ));
}
        return toResponse(saved);
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
                + " | Matches: " + matchCount
                + " | Ref: " + saved.getReference()
                + operatorInfo); //  نضيف اسم الموظف في الـ notes

            var createdCase = caseService.createCase(caseReq, getUsername());

            if (saved.getAction() == ScreeningAction.BLOCK) {
                caseService.updateStatus(createdCase.getId(), "ESCALATED",
                    "Auto-escalated due to BLOCK action", "system");
            }
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
        if (tenantId == null) {
            return repository.findByCreatedByOrderByCreatedAtDesc(username, PageRequest.of(page, size))
                .map(this::toResponse);
        }
        return repository.findByCreatedByAndTenantIdOrderByCreatedAtDesc(
            username, tenantId, PageRequest.of(page, size)).map(this::toResponse);
    }

    // ══════════════════════════════════════════
    //  Stats
    // ══════════════════════════════════════════
    public TransferStatsResponse getStats() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        long total    = repository.count();
        long approved = repository.countByAction(ScreeningAction.APPROVE);
        long reviewed = repository.countByAction(ScreeningAction.REVIEW);
        long blocked  = repository.countByAction(ScreeningAction.BLOCK);
        long today    = repository.countToday(startOfDay, startOfDay.plusDays(1));
        return buildStats(total, approved, reviewed, blocked, today);
    }

    public TransferStatsResponse getStatsByTenant(Long tenantId) { 
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        long total    = repository.countByTenantId(tenantId);
        long approved = repository.countByActionAndTenantId(ScreeningAction.APPROVE, tenantId);
        long reviewed = repository.countByActionAndTenantId(ScreeningAction.REVIEW,  tenantId);
        long blocked  = repository.countByActionAndTenantId(ScreeningAction.BLOCK,   tenantId);
        long today    = repository.countTodayByTenant(tenantId, startOfDay, startOfDay.plusDays(1));
        return buildStats(total, approved, reviewed, blocked, today);
    }

    public TransferStatsResponse getStatsByUser(String username) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        long total    = repository.countByCreatedBy(username);
        long approved = repository.countByCreatedByAndAction(username, ScreeningAction.APPROVE);
        long reviewed = repository.countByCreatedByAndAction(username, ScreeningAction.REVIEW);
        long blocked  = repository.countByCreatedByAndAction(username, ScreeningAction.BLOCK);
        long today    = repository.countTodayByUser(username, startOfDay, startOfDay.plusDays(1));
        return buildStats(total, approved, reviewed, blocked, today);
    }

    private TransferStatsResponse buildStats(long total, long approved, long reviewed,
                                              long blocked, long today) {
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
    //  Helpers
    // ══════════════════════════════════════════
    private List<SanctionSearchResult> searchBothNames(String nameEn, String nameAr) {
        List<SanctionSearchResult> results = new ArrayList<>();
        if (nameEn != null && !nameEn.isBlank())
            results.addAll(sanctionSearchService.search(nameEn, 70.0, 0, 10));
        if (nameAr != null && !nameAr.isBlank()) {
            List<UUID> existingIds = results.stream().map(SanctionSearchResult::getId).toList();
            sanctionSearchService.search(nameAr, 70.0, 0, 10).stream()
                .filter(r -> !existingIds.contains(r.getId()))
                .forEach(results::add);
        }
        return results;
    }

    private int calcPoints(List<SanctionSearchResult> matches) {
    if (matches == null || matches.isEmpty()) return 0;

    // ✅ log كل match
    matches.forEach(m -> log.info("📊 Match: name={} score={} source={}",
        m.getName(), m.getScore(), m.getSource()));

    return matches.stream()
        .filter(m -> m.getScore() >= 70.0)
        .mapToInt(m -> {
            double normalized = ((m.getScore() - 70.0) / 30.0) * 100.0;
            int points = (int) Math.round(normalized * 1.5);
            log.info("📊 Points calc: score={} normalized={} points={}",
                m.getScore(), normalized, points);
            return points;
        })
        .max().orElse(0);
}

    private ScreeningAction resolveAction(int points) {
        if (points <= APPROVE_MAX) return ScreeningAction.APPROVE;
        if (points <= REVIEW_MAX)  return ScreeningAction.REVIEW;
        return ScreeningAction.BLOCK;
    }

    private RiskLevel resolveRiskLevel(int points) {
        if (points == 0)   return RiskLevel.VERY_LOW;
        if (points <= 80)  return RiskLevel.LOW;
        if (points <= 149) return RiskLevel.MEDIUM;
        if (points <= 249) return RiskLevel.HIGH;
        return RiskLevel.CRITICAL;
    }

    private String buildReason(ScreeningAction action, List<SanctionSearchResult> senderMatches,
                                List<SanctionSearchResult> receiverMatches, int totalPoints) {
        if (action == ScreeningAction.APPROVE) return "No sanctions matches found. Transfer cleared.";
        StringBuilder sb = new StringBuilder();
        if (!senderMatches.isEmpty())
            sb.append("Sender matched ").append(senderMatches.size()).append(" sanction record(s). ");
        if (!receiverMatches.isEmpty())
            sb.append("Receiver matched ").append(receiverMatches.size()).append(" sanction record(s). ");
        sb.append("Total risk points: ").append(totalPoints).append(".");
        return sb.toString();
    }

    private TransferScreeningMatch toMatchEntity(SanctionSearchResult m,
                                                  TransferScreeningMatch.Party party) {
        return TransferScreeningMatch.builder()
            .party(party).matchedName(m.getName())
            .source(m.getSource()).score(m.getScore()).build();
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
            .operatorId(r.getOperatorId())      
            .operatorName(r.getOperatorName())   
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