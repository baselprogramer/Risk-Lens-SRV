package com.sdn.blacklist.decision.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.sdn.blacklist.cases.repository.CaseRepository;
import com.sdn.blacklist.decision.dto.DecisionRequest;
import com.sdn.blacklist.decision.dto.DecisionResponse;
import com.sdn.blacklist.decision.entity.Decision;
import com.sdn.blacklist.decision.entity.Decision.ScreeningType;
import com.sdn.blacklist.decision.repository.DecisionRepository;
import com.sdn.blacklist.notifications.NotificationService;
import com.sdn.blacklist.notifications.NotificationService.CaseNotification;
import com.sdn.blacklist.screening.repository.ScreeningRequestRepository;
import com.sdn.blacklist.tenant.context.TenantContext;
import com.sdn.blacklist.transfer.repository.TransferScreeningRepository;
import com.sdn.blacklist.user.repository.UserRepository;
import com.sdn.blacklist.webhook.service.WebhookService;
import com.sdn.blacklist.user.entity.UserRole;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class DecisionService {

    private final DecisionRepository repository;
    private final ScreeningRequestRepository screeningRequestRepo;
    private final TransferScreeningRepository transferRepo;
    private final WebhookService webhookService;
    private final NotificationService notificationService;
    private final CaseRepository caseRepository;
    private final UserRepository userRepository;

    // ══════════════════════════════════════════
    // كل القرارات — Audit Trail
    // ══════════════════════════════════════════
    public List<DecisionResponse> getAll() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return repository.findAllByOrderByDecidedAtDesc()
                    .stream().map(this::toResponseWithDetails).toList();
        }
        return repository.findByTenantIdOrderByDecidedAtDesc(tenantId)
                .stream().map(this::toResponseWithDetails).toList();
    }

    // ══════════════════════════════════════════
    // إنشاء قرار جديد
    // ══════════════════════════════════════════
    @Transactional
    public DecisionResponse createDecision(DecisionRequest req, String username) {
        Long tenantId = TenantContext.getTenantId();

        Decision decision = Decision.builder()
                .screeningType(ScreeningType.valueOf(req.getScreeningType().toUpperCase()))
                .screeningId(req.getScreeningId())
                .decision(Decision.DecisionType.valueOf(req.getDecision().toUpperCase()))
                .comment(req.getComment())
                .decidedBy(username)
                .decidedAt(LocalDateTime.now())
                .tenantId(tenantId)
                .build();

        Decision saved = repository.save(decision);

        log.info(" Decision [{}] on {} #{} by {} [tenant:{}]",
                saved.getDecision(), saved.getScreeningType(),
                saved.getScreeningId(), username, tenantId);

        registerPostCommitAsync(saved, tenantId, username);

        return toResponseWithDetails(saved);
    }

    // ══════════════════════════════════════════
    // تعديل قرار موجود
    // ══════════════════════════════════════════
    @Transactional
    public DecisionResponse updateDecision(Long id, DecisionRequest req, String username) {
        Decision decision = getSecureDecision(id);
        Long tenantId = TenantContext.getTenantId();

        decision.setDecision(Decision.DecisionType.valueOf(req.getDecision().toUpperCase()));
        if (req.getComment() != null)
            decision.setComment(req.getComment());
        decision.setDecidedBy(username);
        decision.setDecidedAt(LocalDateTime.now());

        Decision saved = repository.save(decision);

        log.info(" Decision #{} updated to [{}] by {}", id, saved.getDecision(), username);

        // Webhook + Notification — async بعد commit
        registerPostCommitAsync(saved, tenantId, username);

        return toResponseWithDetails(saved);
    }

    private void registerPostCommitAsync(Decision saved, Long tenantId, String username) {
        final Decision finalSaved = saved;
        final Long finalTenantId = tenantId;
        final String finalUser = username;

        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        // Webhook
                        CompletableFuture.runAsync(() -> {
                            try {
                                webhookService.trigger(finalTenantId,
                                        WebhookService.EVENT_DECISION_CHANGED,
                                        Map.of(
                                                "decisionId", finalSaved.getId(),
                                                "type", finalSaved.getScreeningType().name(),
                                                "decision", finalSaved.getDecision().name(),
                                                "screeningId", finalSaved.getScreeningId(),
                                                "decidedBy", finalUser));
                            } catch (Exception e) {
                                log.warn("⚠️ Webhook failed: {}", e.getMessage());
                            }
                        });

                        // Notification
                        CompletableFuture.runAsync(() -> {
                            try {
                                sendDecisionNotification(
                                        finalSaved.getScreeningType(),
                                        finalSaved.getScreeningId(),
                                        finalSaved.getDecision().name(),
                                        finalUser);
                            } catch (Exception e) {
                                log.warn("⚠️ Notification failed: {}", e.getMessage());
                            }
                        });
                    }
                });
    }

    // ══════════════════════════════════════════
    // منطق الإشعار
    // ══════════════════════════════════════════
private void sendDecisionNotification(ScreeningType screeningType, Long screeningId,
            String decision, String decidedBy) {
        try {
            caseRepository
                    .findByScreeningIdAndCaseType(
                            screeningId,
                            com.sdn.blacklist.cases.entity.CaseType.valueOf(screeningType.name()))
                    .ifPresent(c -> {
                        String assignee = c.getAssignedTo();
                        String creator  = c.getCreatedBy();

                        for (String target : new String[] { assignee, creator }) {
                            if (target == null || target.equals(decidedBy)) continue;
                            if (target.equals(creator) && creator.equals(assignee)
                                    && !target.equals(assignee)) continue;

                            //  مضمون القرار لأدوار مستوى الشركة بس
                            boolean canSee = userRepository.findByUsername(target)
                                .map(u -> u.getRole() == UserRole.SUPER_ADMIN
                                       || u.getRole() == UserRole.COMPANY_ADMIN
                                       || u.getRole() == UserRole.COMPLIANCE_MANAGER)
                                .orElse(false);

                            String msg = canSee
                                ? buildDecisionMessage(decision, c.getSubjectName())
                                : "تم البت بالحالة: " + c.getSubjectName();

                            notificationService.sendToUser(target, new CaseNotification(
                                    c.getId(), c.getReference(), c.getSubjectName(),
                                    c.getStatus().name(),
                                    canSee ? decision : null,
                                    "DECISION", decidedBy, msg));

                            if (assignee != null && assignee.equals(creator)) break;  // ما نبعت مرّتين
                        }
                    });
        } catch (Exception e) {
            log.warn("Could not send decision notification: {}", e.getMessage());
        }
    }

    private String buildDecisionMessage(String decision, String subject) {
        return switch (decision.toUpperCase()) {
            case "TRUE_MATCH" -> "قرار: تطابق حقيقي — " + subject;
            case "FALSE_POSITIVE" -> "قرار: إيجابية كاذبة — " + subject;
            case "RISK_ACCEPTED" -> "قرار: تم قبول المخاطرة — " + subject;
            case "PENDING_REVIEW" -> "القضية لا تزال قيد المراجعة — " + subject;
            default -> "قرار جديد على القضية: " + subject;
        };
    }

    // ══════════════════════════════════════════
    // آخر قرار على نتيجة معينة
    // ══════════════════════════════════════════
    public DecisionResponse getLatestDecision(String screeningType, Long screeningId) {
        Long tenantId = TenantContext.getTenantId();
        return repository
                .findTopByScreeningTypeAndScreeningIdOrderByDecidedAtDesc(
                        ScreeningType.valueOf(screeningType.toUpperCase()), screeningId)
                .filter(d -> tenantId == null || tenantId.equals(d.getTenantId()))
                .map(this::toResponseWithDetails)
                .orElse(null);
    }

    // ══════════════════════════════════════════
    // Audit Trail
    // ══════════════════════════════════════════
    public List<DecisionResponse> getAuditTrail(String screeningType, Long screeningId) {
        Long tenantId = TenantContext.getTenantId();
        return repository
                .findByScreeningTypeAndScreeningIdOrderByDecidedAtDesc(
                        ScreeningType.valueOf(screeningType.toUpperCase()), screeningId)
                .stream()
                .filter(d -> tenantId == null || tenantId.equals(d.getTenantId()))
                .map(this::toResponseWithDetails)
                .toList();
    }

    // ══════════════════════════════════════════
    // إحصائيات
    // ══════════════════════════════════════════
    public DecisionStatsResponse getStats() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return new DecisionStatsResponse(
                    repository.countByDecision(Decision.DecisionType.TRUE_MATCH),
                    repository.countByDecision(Decision.DecisionType.FALSE_POSITIVE),
                    repository.countByDecision(Decision.DecisionType.PENDING_REVIEW),
                    repository.countByDecision(Decision.DecisionType.RISK_ACCEPTED),
                    repository.count());
        }
        return new DecisionStatsResponse(
                repository.countByDecisionAndTenantId(Decision.DecisionType.TRUE_MATCH, tenantId),
                repository.countByDecisionAndTenantId(Decision.DecisionType.FALSE_POSITIVE, tenantId),
                repository.countByDecisionAndTenantId(Decision.DecisionType.PENDING_REVIEW, tenantId),
                repository.countByDecisionAndTenantId(Decision.DecisionType.RISK_ACCEPTED, tenantId),
                repository.countByTenantId(tenantId));
    }

    // ══════════════════════════════════════════
    // Helpers
    // ══════════════════════════════════════════
    private Decision getSecureDecision(Long id) {
        Decision d = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Decision not found: " + id));
        Long tenantId = TenantContext.getTenantId();
        if (tenantId != null && !tenantId.equals(d.getTenantId()))
            throw new RuntimeException("Access denied to decision: " + id);
        return d;
    }

    private DecisionResponse toResponseWithDetails(Decision d) {
        String subjectName = resolveSubjectName(d.getScreeningType(), d.getScreeningId());
        return new DecisionResponse(
                d.getId(),
                d.getScreeningType().name(),
                d.getScreeningId(),
                d.getDecision().name(),
                d.getComment(),
                d.getDecidedBy(),
                d.getDecidedAt(),
                subjectName);
    }

    private String resolveSubjectName(ScreeningType type, Long id) {
        try {
            if (type == ScreeningType.PERSON) {
                return screeningRequestRepo.findByResultId(id)
                        .map(r -> r.getFullName())
                        .orElse("Unknown #" + id);
            } else {
                return transferRepo.findById(id)
                        .map(t -> t.getSenderName() + " → " + t.getReceiverName())
                        .orElse("Transfer #" + id);
            }
        } catch (Exception e) {
            return "—";
        }
    }

    public List<DecisionResponse> getDecisionsForUser(String username) {
        Long tenantId = TenantContext.getTenantId();
        List<com.sdn.blacklist.cases.entity.Case> myCases = tenantId != null
                ? caseRepository.findByAssignedToAndTenantIdOrderByCreatedAtDesc(
                        username, tenantId, PageRequest.of(0, 100)).getContent()
                : caseRepository.findByAssignedToOrderByCreatedAtDesc(
                        username, PageRequest.of(0, 100)).getContent();

        return myCases.stream()
                .flatMap(c -> repository
                        .findByScreeningTypeAndScreeningIdOrderByDecidedAtDesc(
                                ScreeningType.valueOf(c.getCaseType().name()),
                                c.getScreeningId())
                        .stream())
                .map(this::toResponseWithDetails)
                .toList();
    }

    public record DecisionStatsResponse(
            long trueMatches,
            long falsePositives,
            long pendingReview,
            long riskAccepted,
            long total) {
    }
}