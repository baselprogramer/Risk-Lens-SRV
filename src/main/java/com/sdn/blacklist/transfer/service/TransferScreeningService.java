package com.sdn.blacklist.transfer.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
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

    private static final int APPROVE_MAX = 40;
    private static final int REVIEW_MAX  = 99;

    // ✅ Java 21 Virtual Threads
    private static final ExecutorService VIRTUAL_EXEC =
        Executors.newVirtualThreadPerTaskExecutor();

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

        ConfirmingData senderConfirming = ConfirmingData.fromRequest(
            req.getSenderNationality(), req.getSenderDob(),
            req.getSenderIdNumber(),    req.getSenderIdType());

        ConfirmingData receiverConfirming = ConfirmingData.fromRequest(
            req.getReceiverNationality(), req.getReceiverDob(),
            req.getReceiverIdNumber(),    req.getReceiverIdType());

        log.info("🔍 Transfer | sender='{}' | receiver='{}' | {}{}",
            req.getSenderName(), req.getReceiverName(),
            req.getAmount(), req.getCurrency());

        // ── Parallel search ───────────────────────────────────────────────────
        CompletableFuture<List<SanctionSearchResult>> senderFuture =
            CompletableFuture.supplyAsync(
                () -> searchBothNamesParallel(req.getSenderName(), req.getSenderNameAr()),
                VIRTUAL_EXEC);

        CompletableFuture<List<SanctionSearchResult>> receiverFuture =
            CompletableFuture.supplyAsync(
                () -> searchBothNamesParallel(req.getReceiverName(), req.getReceiverNameAr()),
                VIRTUAL_EXEC);

        try {
            CompletableFuture.allOf(senderFuture, receiverFuture)
                .get(2000, TimeUnit.MILLISECONDS);
        } catch (TimeoutException e) {
            log.warn("⚠️ Transfer search timeout after 2000ms — returning partial results");
        } catch (Exception e) {
            log.error("⚠️ Transfer search error: {}", e.getMessage());
        }

        List<SanctionSearchResult> senderMatches   = new ArrayList<>(senderFuture.getNow(List.of()));
        List<SanctionSearchResult> receiverMatches = new ArrayList<>(receiverFuture.getNow(List.of()));

        log.info("⏱️ Search done: {}ms | sender={} | receiver={}",
            System.currentTimeMillis() - start,
            senderMatches.size(), receiverMatches.size());

        // ── Confirming factors ────────────────────────────────────────────────
        if (!senderConfirming.isEmpty())   applyConfirmingFactors(senderMatches,   senderConfirming);
        if (!receiverConfirming.isEmpty()) applyConfirmingFactors(receiverMatches, receiverConfirming);

        // ── Points ────────────────────────────────────────────────────────────
        int senderPoints   = calcPoints(senderMatches,   "SENDER");
        int receiverPoints = calcPoints(receiverMatches, "RECEIVER");
        int totalPoints    = senderPoints + receiverPoints;

        // ── Country Risk ──────────────────────────────────────────────────────
        double countryRiskScore = countryRiskService.getRiskScore(req.getCountry());
        if (countryRiskScore > 0) {
            totalPoints += (int) Math.round(countryRiskScore * 0.5);
            log.info("🌍 Country risk [{}]: +{} points", req.getCountry(), (int)(countryRiskScore * 0.5));
        }

        // ── Amount Risk ───────────────────────────────────────────────────────
        int amountRiskPoints = calcAmountRiskPoints(req);
        if (amountRiskPoints > 0) {
            totalPoints += amountRiskPoints;
            log.info("💰 Amount risk: +{} points", amountRiskPoints);
        }

        // ── Action + Risk Level ───────────────────────────────────────────────
        ScreeningAction action    = resolveAction(totalPoints);
        RiskLevel       riskLevel = resolveRiskLevel(totalPoints);
        String          reason    = buildReason(action, req, senderMatches, receiverMatches,
                                                totalPoints, amountRiskPoints);
        long procMs   = System.currentTimeMillis() - start;
        Long tenantId = TenantContext.getTenantId();

        rateLimitService.countRequest();

        // ── Match Entities ────────────────────────────────────────────────────
        List<TransferScreeningMatch> matchEntities = new ArrayList<>();
        senderMatches.forEach(m   -> matchEntities.add(toMatchEntity(m, TransferScreeningMatch.Party.SENDER)));
        receiverMatches.forEach(m -> matchEntities.add(toMatchEntity(m, TransferScreeningMatch.Party.RECEIVER)));

        if (countryRiskScore > 0) {
            matchEntities.add(TransferScreeningMatch.builder()
                .party(TransferScreeningMatch.Party.SENDER)
                .matchedName("Country Risk: " + req.getCountry()
                    + " [" + countryRiskService.getRiskTier(req.getCountry()) + "]")
                .source("FATF").score(countryRiskScore).build());
        }
        if (amountRiskPoints > 0) {
            matchEntities.add(TransferScreeningMatch.builder()
                .party(TransferScreeningMatch.Party.SENDER)
                .matchedName("Amount Threshold: " + req.getAmount() + " " + req.getCurrency())
                .source("THRESHOLD").score((double) amountRiskPoints).build());
        }

        // ── Build Record ──────────────────────────────────────────────────────
        // ✅ خزّن الـ username بالـ main thread قبل الـ async
        final String createdBy = (req.getCreatedBy() != null && !req.getCreatedBy().isBlank())
            ? req.getCreatedBy() : getUsername();

        TransferScreeningRecord record = TransferScreeningRecord.builder()
            .reference(generateReference())
            .senderName(req.getSenderName())
            .senderNameAr(req.getSenderNameAr())
            .senderNationality(req.getSenderNationality())
            .senderDob(req.getSenderDob())
            .senderIdType(req.getSenderIdType())
            .senderIdNumber(req.getSenderIdNumber())
            .senderIdExpiry(req.getSenderIdExpiry())
            .senderMotherName(req.getSenderMotherName())
            .senderPhone(req.getSenderPhone())
            .senderAddress(req.getSenderAddress())
            .senderResidenceStatus(req.getSenderResidenceStatus())
            .receiverName(req.getReceiverName())
            .receiverNameAr(req.getReceiverNameAr())
            .receiverNationality(req.getReceiverNationality())
            .receiverDob(req.getReceiverDob())
            .receiverIdType(req.getReceiverIdType())
            .receiverIdNumber(req.getReceiverIdNumber())
            .receiverPhone(req.getReceiverPhone())
            .receiverBankName(req.getReceiverBankName())
            .receiverAccountNumber(req.getReceiverAccountNumber())
            .receiverRelationship(req.getReceiverRelationship())
            .country(req.getCountry())
            .city(req.getCity())
            .amount(req.getAmount())
            .currency(req.getCurrency())
            .amountInUsd(req.getAmountInUsd())
            .transferPurpose(req.getTransferPurpose())
            .purposeDetails(req.getPurposeDetails())
            .agentName(req.getAgentName())
            .commissionType(req.getCommissionType())
            .deliveryMethod(req.getDeliveryMethod())
            .branchId(req.getBranchId())
            .branchName(req.getBranchName())
            .action(action)
            .riskLevel(riskLevel)
            .riskPoints(totalPoints)
            .reason(reason)
            .processingMs(procMs)
            .createdBy(createdBy)
            .tenantId(tenantId)
            .operatorId(req.getOperatorId())
            .operatorName(req.getOperatorName())
            .externalReference(req.getExternalReference())
            .build();

        matchEntities.forEach(m -> m.setScreening(record));
        record.setMatches(matchEntities);

        TransferScreeningRecord saved = repository.save(record);

        log.info("✅ Transfer [{}] → {} | Risk:{} | Points:{} | {}ms | by:{}",
            saved.getReference(), action, riskLevel, totalPoints, procMs, createdBy);

        // ── Async post-commit ─────────────────────────────────────────────────
        final TransferScreeningRecord finalSaved      = saved;
        final int                     finalMatchCount = senderMatches.size() + receiverMatches.size();
        final Long                    finalTenantId   = tenantId;
        // ✅ createdBy محفوظ من الـ main thread — بيتمرر للـ async بشكل صح
        final String                  finalCreatedBy  = createdBy;

        TransactionSynchronizationManager.registerSynchronization(
            new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    // ✅ Case creation — بـ TenantContext + username صحيحين
                    CompletableFuture.runAsync(() -> {
                        try {
                            TenantContext.setTenantId(finalTenantId);
                            autoCreateCase(finalSaved, finalMatchCount, finalCreatedBy);
                        } catch (Exception e) {
                            log.warn("⚠️ Async case creation failed: {}", e.getMessage());
                        } finally {
                            TenantContext.clear();
                        }
                    }, VIRTUAL_EXEC);

                    // ✅ Webhook
                    if (finalSaved.getRiskLevel() == RiskLevel.HIGH
                            || finalSaved.getRiskLevel() == RiskLevel.CRITICAL) {
                        CompletableFuture.runAsync(() -> {
                            try {
                                webhookService.trigger(finalTenantId,
                                    WebhookService.EVENT_TRANSFER_HIGH,
                                    Map.of(
                                        "reference",    finalSaved.getReference(),
                                        "riskLevel",    finalSaved.getRiskLevel().name(),
                                        "action",       finalSaved.getAction().name(),
                                        "transferId",   finalSaved.getId(),
                                        "senderName",   finalSaved.getSenderName(),
                                        "receiverName", finalSaved.getReceiverName()
                                    ));
                            } catch (Exception e) {
                                log.warn("⚠️ Async webhook failed: {}", e.getMessage());
                            }
                        }, VIRTUAL_EXEC);
                    }
                }
            });

        return toResponse(saved);
    }

    // ══════════════════════════════════════════
    //  searchBothNamesParallel
    // ══════════════════════════════════════════
    private List<SanctionSearchResult> searchBothNamesParallel(String nameEn, String nameAr) {
        boolean hasEn = nameEn != null && !nameEn.isBlank();
        boolean hasAr = nameAr != null && !nameAr.isBlank();
        if (!hasEn && !hasAr) return List.of();

        CompletableFuture<List<SanctionSearchResult>> enFuture = hasEn
            ? CompletableFuture.supplyAsync(() -> sanctionSearchService.search(nameEn, 70.0, 0, 10), VIRTUAL_EXEC)
            : CompletableFuture.completedFuture(List.of());

        CompletableFuture<List<SanctionSearchResult>> arFuture = hasAr
            ? CompletableFuture.supplyAsync(() -> sanctionSearchService.search(nameAr, 70.0, 0, 10), VIRTUAL_EXEC)
            : CompletableFuture.completedFuture(List.of());

        try {
            CompletableFuture.allOf(enFuture, arFuture).get(1500, TimeUnit.MILLISECONDS);
        } catch (TimeoutException e) {
            log.warn("⚠️ Name search timeout for '{}'", nameEn);
        } catch (Exception e) {
            log.debug("Name search error: {}", e.getMessage());
        }

        List<SanctionSearchResult> results = new ArrayList<>(enFuture.getNow(List.of()));
        Set<UUID> seen = results.stream()
            .filter(r -> r.getId() != null)
            .map(SanctionSearchResult::getId)
            .collect(Collectors.toSet());

        arFuture.getNow(List.of()).stream()
            .filter(r -> r.getId() == null || seen.add(r.getId()))
            .forEach(results::add);

        return results;
    }

    // ══════════════════════════════════════════
    //  applyConfirmingFactors
    // ══════════════════════════════════════════
    private void applyConfirmingFactors(List<SanctionSearchResult> results, ConfirmingData input) {
        for (SanctionSearchResult r : results)
            r.applyConfirmingFactors(input, SanctionRecordData.empty());
    }

    // ══════════════════════════════════════════
    //  calcAmountRiskPoints
    // ══════════════════════════════════════════
    private int calcAmountRiskPoints(TransferScreeningRequest req) {
        if (req.getAmount() == null) return 0;
        double amount = req.getAmountInUsd() != null
            ? req.getAmountInUsd().doubleValue()
            : req.getAmount().doubleValue();
        if ("SYP".equalsIgnoreCase(req.getCurrency()) && req.getAmountInUsd() == null) return 0;
        if (amount >= 10_000) return 20;
        if (amount >= 5_000)  return 10;
        if (amount >= 1_000)  return 5;
        return 0;
    }

    // ══════════════════════════════════════════
    //  calcPoints
    // ══════════════════════════════════════════
    private int calcPoints(List<SanctionSearchResult> matches, String party) {
        if (matches == null || matches.isEmpty()) return 0;
        return matches.stream()
            .filter(m -> m.getScore() >= 70.0)
            .mapToInt(m -> {
                double weight = calcWeight(m.getSource());
                double base   = ((m.getScore() - 70.0) / 30.0) * 100.0;
                int    points = (int) Math.round(base * weight);
                log.info("📊 [{}] '{}' score={} source={} → {} pts",
                    party, m.getName(), m.getScore(), m.getSource(), points);
                return points;
            })
            .max().orElse(0);
    }

    private static double calcWeight(String source) {
        return switch ((source != null ? source : "").toUpperCase()) {
            case "OFAC","UN","EU","UK","LOCAL" -> 1.5;
            case "PEP"                         -> 1.25;
            case "INTERPOL"                    -> 1.2;
            case "FATF","WORLD_BANK"            -> 1.1;
            default                            -> 1.0;
        };
    }

    private ScreeningAction resolveAction(int points) {
        if (points <= APPROVE_MAX) return ScreeningAction.APPROVE;
        if (points <= REVIEW_MAX)  return ScreeningAction.REVIEW;
        return ScreeningAction.BLOCK;
    }

    private RiskLevel resolveRiskLevel(int points) {
        if (points == 0)   return RiskLevel.VERY_LOW;
        if (points <= 40)  return RiskLevel.LOW;
        if (points <= 99)  return RiskLevel.MEDIUM;
        if (points <= 149) return RiskLevel.HIGH;
        return RiskLevel.CRITICAL;
    }

    // ══════════════════════════════════════════
    //  buildReason
    // ══════════════════════════════════════════
    private String buildReason(ScreeningAction action, TransferScreeningRequest req,
                                List<SanctionSearchResult> senderMatches,
                                List<SanctionSearchResult> receiverMatches,
                                int totalPoints, int amountPoints) {
        if (action == ScreeningAction.APPROVE)
            return "No sanctions matches found. Transfer cleared.";
        StringBuilder sb = new StringBuilder();
        if (!senderMatches.isEmpty()) {
            sb.append("Sender matched ").append(senderMatches.size()).append(" sanction record(s)");
            senderMatches.stream().filter(m -> !"UNCONFIRMED".equals(m.getConfidenceLevel()))
                .findFirst().ifPresent(m -> sb.append(" [").append(m.getConfidenceLevel()).append("]"));
            sb.append(". ");
        }
        if (!receiverMatches.isEmpty()) {
            sb.append("Receiver matched ").append(receiverMatches.size()).append(" sanction record(s)");
            receiverMatches.stream().filter(m -> !"UNCONFIRMED".equals(m.getConfidenceLevel()))
                .findFirst().ifPresent(m -> sb.append(" [").append(m.getConfidenceLevel()).append("]"));
            sb.append(". ");
        }
        if (amountPoints > 0)
            sb.append("Amount threshold triggered (")
              .append(req.getAmount()).append(" ").append(req.getCurrency()).append("). ");
        sb.append("Total risk points: ").append(totalPoints).append(".");
        return sb.toString();
    }

    // ══════════════════════════════════════════
    //  Auto-create Case
    //
    //  ✅ createdBy يوصل من الـ main thread
    //     (الـ async thread ما عنده SecurityContext)
    //  ✅ assignedTo = createdBy — الموظف يشوف
    //     الـ case بصفحة الـ Case Management
    // ══════════════════════════════════════════
    private void autoCreateCase(TransferScreeningRecord saved, int matchCount, String createdBy) {
        if (saved.getAction() == ScreeningAction.APPROVE) return;
        try {
            String subjectName = saved.getSenderName() + " → " + saved.getReceiverName();
            CaseRequest caseReq = new CaseRequest();
            caseReq.setCaseType("TRANSFER");
            caseReq.setScreeningId(saved.getId());
            caseReq.setSubjectName(subjectName);
            caseReq.setPriority(mapActionToPriority(saved.getAction(), saved.getRiskLevel()));
            caseReq.setAssignedTo(createdBy); // ✅ عيّن للموظف اللي أنشأ الـ transfer
            caseReq.setNotes("Auto-created — Action: " + saved.getAction()
                + " | Risk: " + saved.getRiskLevel()
                + " | Points: " + saved.getRiskPoints()
                + " | Matches: " + matchCount
                + " | Ref: " + saved.getReference()
                + (saved.getOperatorName() != null ? " | Operator: " + saved.getOperatorName() : ""));

            var createdCase = caseService.createCase(caseReq, createdBy); // ✅ username صح

            if (saved.getAction() == ScreeningAction.BLOCK) {
                caseService.updateStatus(createdCase.getId(),
                    "ESCALATED", "Auto-escalated due to BLOCK action", "system");
            }

            log.info("✅ Case #{} created for transfer [{}] — assigned to '{}'",
                createdCase.getId(), saved.getReference(), createdBy);

        } catch (Exception e) {
            log.warn("⚠️ Case not created for transfer {}: {}",
                saved.getReference(), e.getMessage());
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
    //  History & Stats
    // ══════════════════════════════════════════
    public Page<TransferScreeningResponse> getHistory(int page, int size) {
        return repository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size)).map(this::toResponse);
    }

    public Page<TransferScreeningResponse> getHistoryByTenant(Long tenantId, int page, int size) {
        return repository.findByTenantIdOrderByCreatedAtDesc(tenantId, PageRequest.of(page, size)).map(this::toResponse);
    }

    public Page<TransferScreeningResponse> getHistoryByUser(String username, int page, int size) {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null)
            return repository.findByCreatedByOrderByCreatedAtDesc(username, PageRequest.of(page, size)).map(this::toResponse);
        return repository.findByCreatedByAndTenantIdOrderByCreatedAtDesc(username, tenantId, PageRequest.of(page, size)).map(this::toResponse);
    }

    public TransferStatsResponse getStats() {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        return buildStats(
            repository.count(),
            repository.countByAction(ScreeningAction.APPROVE),
            repository.countByAction(ScreeningAction.REVIEW),
            repository.countByAction(ScreeningAction.BLOCK),
            repository.countToday(start, start.plusDays(1)));
    }

    public TransferStatsResponse getStatsByTenant(Long tenantId) {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        return buildStats(
            repository.countByTenantId(tenantId),
            repository.countByActionAndTenantId(ScreeningAction.APPROVE, tenantId),
            repository.countByActionAndTenantId(ScreeningAction.REVIEW,  tenantId),
            repository.countByActionAndTenantId(ScreeningAction.BLOCK,   tenantId),
            repository.countTodayByTenant(tenantId, start, start.plusDays(1)));
    }

    public TransferStatsResponse getStatsByUser(String username) {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        return buildStats(
            repository.countByCreatedBy(username),
            repository.countByCreatedByAndAction(username, ScreeningAction.APPROVE),
            repository.countByCreatedByAndAction(username, ScreeningAction.REVIEW),
            repository.countByCreatedByAndAction(username, ScreeningAction.BLOCK),
            repository.countTodayByUser(username, start, start.plusDays(1)));
    }

    private TransferStatsResponse buildStats(long total, long approved,
                                              long reviewed, long blocked, long today) {
        return TransferStatsResponse.builder()
            .total(total).approved(approved).reviewed(reviewed).blocked(blocked).today(today)
            .blockRate(total  > 0 ? (double) blocked  / total * 100 : 0)
            .reviewRate(total > 0 ? (double) reviewed / total * 100 : 0)
            .build();
    }

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
            .party(party)
            .matchedName(m.getName())
            .source(m.getSource())
            .score(m.getScore())
            .build();
    }

    private TransferScreeningResponse toResponse(TransferScreeningRecord r) {
        List<TransferScreeningResponse.MatchDTO> matchDTOs = Collections.emptyList();
        if (r.getMatches() != null) {
            matchDTOs = r.getMatches().stream()
                .map(m -> TransferScreeningResponse.MatchDTO.builder()
                    .party(m.getParty().name())
                    .matchedName(m.getMatchedName())
                    .source(m.getSource())
                    .score(m.getScore())
                    .entityType(m.getEntityType())
                    .country(m.getCountry())
                    .sanctionId(m.getSanctionId())
                    .build())
                .collect(Collectors.toList());
        }
        return TransferScreeningResponse.builder()
            .id(r.getId())
            .reference(r.getReference())
            .senderName(r.getSenderName())
            .senderNameAr(r.getSenderNameAr())
            .senderNationality(r.getSenderNationality())
            .senderDob(r.getSenderDob())
            .senderIdType(r.getSenderIdType())
            .senderIdNumber(r.getSenderIdNumber())
            .senderPhone(r.getSenderPhone())
            .senderResidenceStatus(r.getSenderResidenceStatus())
            .receiverName(r.getReceiverName())
            .receiverNameAr(r.getReceiverNameAr())
            .receiverNationality(r.getReceiverNationality())
            .receiverBankName(r.getReceiverBankName())
            .receiverAccountNumber(r.getReceiverAccountNumber())
            .receiverRelationship(r.getReceiverRelationship())
            .country(r.getCountry())
            .city(r.getCity())
            .amount(r.getAmount())
            .currency(r.getCurrency())
            .amountInUsd(r.getAmountInUsd())
            .transferPurpose(r.getTransferPurpose())
            .agentName(r.getAgentName())
            .deliveryMethod(r.getDeliveryMethod())
            .branchId(r.getBranchId())
            .branchName(r.getBranchName())
            .operatorId(r.getOperatorId())
            .operatorName(r.getOperatorName())
            .externalReference(r.getExternalReference())
            .action(r.getAction())
            .riskLevel(r.getRiskLevel())
            .riskPoints(r.getRiskPoints())
            .reason(r.getReason())
            .processingMs(r.getProcessingMs())
            .matches(matchDTOs)
            .createdAt(r.getCreatedAt())
            .createdBy(r.getCreatedBy())
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