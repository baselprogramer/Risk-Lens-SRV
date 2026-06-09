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
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
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
import com.sdn.blacklist.common.util.NameTranslator;
import com.sdn.blacklist.common.util.SmartNameMatcher;
import com.sdn.blacklist.entity.SanctionEntity;
import com.sdn.blacklist.notifications.NotificationService;
import com.sdn.blacklist.notifications.NotificationService.CaseNotification;
import com.sdn.blacklist.repository.SanctionRepository;
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
    private final SanctionRepository          sanctionRepository;  // ✅ KYC
    private final NotificationService         notificationService; // ✅ إشعارات الموظف

    private static final ExecutorService VIRTUAL_EXEC =
        Executors.newVirtualThreadPerTaskExecutor();

    private static final ObjectMapper JSON = new ObjectMapper();

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
            log.warn("⚠️ Transfer search timeout — returning partial results");
        } catch (Exception e) {
            log.error("⚠️ Transfer search error: {}", e.getMessage());
        }

        List<SanctionSearchResult> senderMatches   = new ArrayList<>(senderFuture.getNow(List.of()));
        List<SanctionSearchResult> receiverMatches = new ArrayList<>(receiverFuture.getNow(List.of()));

        log.info("⏱️ Search: {}ms | sender={} | receiver={}",
            System.currentTimeMillis() - start, senderMatches.size(), receiverMatches.size());

        // ── Confirming factors (KYC) ──────────────────────────────────────────
        if (!senderConfirming.isEmpty())   applyConfirmingFactors(senderMatches,   senderConfirming);
        if (!receiverConfirming.isEmpty()) applyConfirmingFactors(receiverMatches, receiverConfirming);

        // ── Points ────────────────────────────────────────────────────────────
        int senderPoints   = calcPoints(senderMatches,   "SENDER");
        int receiverPoints = calcPoints(receiverMatches, "RECEIVER");
        int totalPoints    = senderPoints + receiverPoints;

        // ── Country Risk ──────────────────────────────────────────────────────
        double countryRiskScore = countryRiskService.getRiskScore(req.getCountry());
        int    countryRiskPts   = RiskCalculator.calcCountryRiskPoints(countryRiskScore);
        if (countryRiskPts > 0) {
            totalPoints += countryRiskPts;
            log.info("🌍 Country risk [{}]: +{} points", req.getCountry(), countryRiskPts);
        }

        // ── Amount Risk ───────────────────────────────────────────────────────
        double amountUsd = req.getAmountInUsd() != null
            ? req.getAmountInUsd().doubleValue()
            : (req.getAmount() != null ? req.getAmount().doubleValue() : 0);
        int amountRiskPoints = RiskCalculator.calcAmountRiskPoints(amountUsd, req.getCurrency());
        if (amountRiskPoints > 0) {
            totalPoints += amountRiskPoints;
            log.info("💰 Amount risk: +{} points", amountRiskPoints);
        }

        // ── Action + Risk Level ───────────────────────────────────────────────
        ScreeningAction action    = toEntityAction(RiskCalculator.resolveTransferAction(totalPoints));
        RiskLevel       riskLevel = toEntityRiskLevel(RiskCalculator.resolveTransferRisk(totalPoints));
        String          reason    = buildReason(action, req, senderMatches, receiverMatches,
                                                totalPoints, amountRiskPoints);
        long procMs   = System.currentTimeMillis() - start;
        Long tenantId = TenantContext.getTenantId();

        rateLimitService.countRequest();

        // ── Match Entities ────────────────────────────────────────────────────
        List<TransferScreeningMatch> matchEntities = new ArrayList<>();
        senderMatches.forEach(m   -> matchEntities.add(toMatchEntity(m, TransferScreeningMatch.Party.SENDER)));
        receiverMatches.forEach(m -> matchEntities.add(toMatchEntity(m, TransferScreeningMatch.Party.RECEIVER)));

        if (countryRiskPts > 0) {
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
        final String                  finalCreatedBy  = createdBy;

        TransactionSynchronizationManager.registerSynchronization(
            new TransactionSynchronization() {
                @Override
                public void afterCommit() {
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
    //  toEntityAction / toEntityRiskLevel
    // ══════════════════════════════════════════
    private static ScreeningAction toEntityAction(RiskCalculator.TransferAction a) {
        return switch (a) {
            case APPROVE -> ScreeningAction.APPROVE;
            case REVIEW  -> ScreeningAction.REVIEW;
            case BLOCK   -> ScreeningAction.BLOCK;
        };
    }

    private static RiskLevel toEntityRiskLevel(RiskCalculator.RiskLevel r) {
        return switch (r) {
            case VERY_LOW -> RiskLevel.VERY_LOW;
            case LOW      -> RiskLevel.LOW;
            case MEDIUM   -> RiskLevel.MEDIUM;
            case HIGH     -> RiskLevel.HIGH;
            case CRITICAL -> RiskLevel.CRITICAL;
        };
    }

    // ══════════════════════════════════════════
    //  calcPoints
    // ══════════════════════════════════════════
    private int calcPoints(List<SanctionSearchResult> matches, String party) {
        if (matches == null || matches.isEmpty()) return 0;
        return matches.stream()
            .filter(m -> m.getScore() >= 70.0)
            .mapToInt(m -> {
                int pts = RiskCalculator.calcNameRiskPoints(m.getScore(), m.getSource());
                pts = (int) RiskCalculator.applyConfidenceBoost(pts, m.getConfidenceLevel());
                log.info("📊 [{}] '{}' score={} source={} level={} → {} pts",
                    party, m.getName(), m.getScore(), m.getSource(),
                    SmartNameMatcher.classifyScore(m.getScore()), pts);
                return pts;
            })
            .max().orElse(0);
    }

    // ══════════════════════════════════════════
    //  searchBothNamesParallel
    // ══════════════════════════════════════════
    private List<SanctionSearchResult> searchBothNamesParallel(String nameEn, String nameAr) {
        boolean hasEn = nameEn != null && !nameEn.isBlank();
        boolean hasAr = nameAr != null && !nameAr.isBlank();
        if (!hasEn && !hasAr) return List.of();

        // لو اسم عربي بس → ترجمه للإنجليزي
        if (hasAr && !hasEn) {
            try {
                String translated = NameTranslator.translateNameViaApi(nameAr);
                if (translated != null && !translated.isBlank()
                        && !SmartNameMatcher.isArabic(translated)) {
                    nameEn = translated;
                    hasEn  = true;
                    log.info("🌐 AR→EN transfer: '{}' → '{}'", nameAr, nameEn);
                }
            } catch (Exception e) {
                String translit = SmartNameMatcher.transliterate(
                    SmartNameMatcher.normalizeAr(nameAr));
                if (!translit.isBlank()) { nameEn = translit; hasEn = true; }
            }
        }

        final String  fNameEn = nameEn;
        final String  fNameAr = nameAr;
        final boolean fHasEn  = hasEn;
        final boolean fHasAr  = hasAr;

        CompletableFuture<List<SanctionSearchResult>> enFuture = fHasEn
            ? CompletableFuture.supplyAsync(
                () -> sanctionSearchService.search(fNameEn, 70.0, 0, 10), VIRTUAL_EXEC)
            : CompletableFuture.completedFuture(List.of());

        CompletableFuture<List<SanctionSearchResult>> arFuture = fHasAr
            ? CompletableFuture.supplyAsync(
                () -> sanctionSearchService.search(fNameAr, 70.0, 0, 10), VIRTUAL_EXEC)
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
    //  KYC — applyConfirmingFactors
    //  ✅ بدل SanctionRecordData.empty() القديمة
    //     هلأ بيجيب البيانات الحقيقية من الـ DB
    // ══════════════════════════════════════════
    private void applyConfirmingFactors(List<SanctionSearchResult> results, ConfirmingData input) {
        for (SanctionSearchResult r : results) {
            SanctionRecordData data = extractSanctionData(r);
            r.applyConfirmingFactors(input, data);
            log.debug("🔎 KYC [{}]: sanctionDOB={} inputDOB={} → confidence={}",
                r.getName(),
                data.dob != null ? data.dob.getYear() : "—",
                input.dob != null ? input.dob.getYear() : "—",
                r.getConfidenceLevel());
        }
    }

    // ══════════════════════════════════════════
    //  extractSanctionData — جيب البيانات من DB
    // ══════════════════════════════════════════
    private SanctionRecordData extractSanctionData(SanctionSearchResult result) {
        if (result.getId() == null) return SanctionRecordData.empty();
        try {
            UUID   uuid = result.getId();
            String src  = result.getSource();

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
            log.debug("extractSanctionData failed: {}", e.getMessage());
            return SanctionRecordData.empty();
        }
    }

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
        } catch (Exception e) { return null; }
    }

    private LocalDate extractYearFromText(String text) {
        if (text == null || text.isBlank()) return null;
        text = text.replaceAll("[\"\\[\\]]", "").trim();
        try {
            if (text.length() >= 10 && text.charAt(4) == '-')
                return LocalDate.parse(text.substring(0, 10));
        } catch (Exception ignored) {}
        Matcher m = Pattern.compile("\\b(19|20)\\d{2}\\b").matcher(text);
        if (m.find()) return LocalDate.of(Integer.parseInt(m.group()), 1, 1);
        return null;
    }

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
            senderMatches.stream().max(java.util.Comparator.comparingDouble(SanctionSearchResult::getScore))
                .ifPresent(m -> sb.append(" [").append(SmartNameMatcher.classifyScore(m.getScore())).append("]"));
            sb.append(". ");
        }
        if (!receiverMatches.isEmpty()) {
            sb.append("Receiver matched ").append(receiverMatches.size()).append(" sanction record(s)");
            receiverMatches.stream().max(java.util.Comparator.comparingDouble(SanctionSearchResult::getScore))
                .ifPresent(m -> sb.append(" [").append(SmartNameMatcher.classifyScore(m.getScore())).append("]"));
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
    //  ✅ أضفنا إشعار للموظف لـ REVIEW/MEDIUM/HIGH
    //  ✅ BLOCK → إشعاره يجي من updateStatus
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
            caseReq.setAssignedTo(createdBy);
            caseReq.setNotes("Auto-created — Action: " + saved.getAction()
                + " | Risk: " + saved.getRiskLevel()
                + " | Points: " + saved.getRiskPoints()
                + " | Matches: " + matchCount
                + " | Ref: " + saved.getReference()
                + (saved.getOperatorName() != null ? " | Operator: " + saved.getOperatorName() : ""));

            var created = caseService.createCase(caseReq, createdBy);

            // ✅ أبلغ الموظف لـ REVIEW — BLOCK بياخذ إشعاره من updateStatus
            if (saved.getAction() == ScreeningAction.REVIEW) {
                String msg = saved.getRiskLevel() == RiskLevel.HIGH
                    ? "⚠️ تنبيه عالي: تحويل يحتاج مراجعة — " + subjectName
                    : "تحويل يحتاج مراجعة — " + subjectName;
                try {
                    notificationService.sendToUser(createdBy, new CaseNotification(
                        created.getId(),
                        created.getReference(),
                        subjectName,
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

            if (saved.getAction() == ScreeningAction.BLOCK) {
                caseService.updateStatus(created.getId(),
                    "ESCALATED", "Auto-escalated due to BLOCK action", "system");
            }

            log.info("✅ Case #{} for transfer [{}] — assigned to '{}'",
                created.getId(), saved.getReference(), createdBy);

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
        return buildStats(repository.count(),
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