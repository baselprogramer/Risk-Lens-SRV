package com.sdn.blacklist.decision.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sdn.blacklist.cases.repository.CaseRepository;
import com.sdn.blacklist.cases.entity.CaseStatus;
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
import com.sdn.blacklist.webhook.service.WebhookService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class DecisionService {

    private final DecisionRepository            repository;
    private final ScreeningRequestRepository    screeningRequestRepo;
    private final TransferScreeningRepository   transferRepo;
    private final WebhookService                webhookService;
    private final NotificationService           notificationService; // ✅ أضفنا
    private final CaseRepository                caseRepository;      // ✅ أضفنا

    // ══════════════════════════════════════════
    //  كل القرارات — Audit Trail
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
    //  إنشاء قرار جديد ← يبعث إشعار فوري
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

        webhookService.trigger(tenantId,
            WebhookService.EVENT_DECISION_CHANGED,
            Map.of(
                "decisionId",  saved.getId(),
                "type",        saved.getScreeningType().name(),
                "decision",    saved.getDecision().name(),
                "screeningId", saved.getScreeningId(),
                "decidedBy",   username
            ));

        log.info("✅ Decision [{}] on {} #{} by {} [tenant:{}]",
            saved.getDecision(), saved.getScreeningType(),
            saved.getScreeningId(), username, tenantId);

        // ✅ إشعار فوري — ابحث عن الـ case المرتبط وأبلغ الموظف
        sendDecisionNotification(
            saved.getScreeningType(),
            saved.getScreeningId(),
            saved.getDecision().name(),
            username
        );

        return toResponseWithDetails(saved);
    }

    // ══════════════════════════════════════════
    //  تعديل قرار موجود ← يبعث إشعار فوري
    // ══════════════════════════════════════════
    @Transactional
    public DecisionResponse updateDecision(Long id, DecisionRequest req, String username) {
        Decision decision = getSecureDecision(id);

        decision.setDecision(Decision.DecisionType.valueOf(req.getDecision().toUpperCase()));
        if (req.getComment() != null) decision.setComment(req.getComment());
        decision.setDecidedBy(username);
        decision.setDecidedAt(LocalDateTime.now());

        Decision saved = repository.save(decision);

        webhookService.trigger(TenantContext.getTenantId(),
            WebhookService.EVENT_DECISION_CHANGED,
            Map.of(
                "decisionId",  saved.getId(),
                "type",        saved.getScreeningType().name(),
                "decision",    saved.getDecision().name(),
                "screeningId", saved.getScreeningId(),
                "decidedBy",   username
            ));

        log.info("✅ Decision #{} updated to [{}] by {}", id, saved.getDecision(), username);

        // ✅ إشعار فوري عند التعديل كمان
        sendDecisionNotification(
            saved.getScreeningType(),
            saved.getScreeningId(),
            saved.getDecision().name(),
            username
        );

        return toResponseWithDetails(saved);
    }

    // ══════════════════════════════════════════
    //  منطق الإشعار — يجيب الـ case ويبلغ الموظف
    // ══════════════════════════════════════════
    private void sendDecisionNotification(ScreeningType screeningType, Long screeningId,
                                          String decision, String decidedBy) {
        try {
            // جيب الـ case المرتبط بهذا الـ screeningId
            caseRepository
                .findByScreeningIdAndCaseType(
                    screeningId,
                    com.sdn.blacklist.cases.entity.CaseType.valueOf(screeningType.name())
                )
                .ifPresent(c -> {
                    String assignee = c.getAssignedTo();
                    String creator  = c.getCreatedBy();
                    String msg      = buildDecisionMessage(decision, c.getSubjectName());

                    // أبلغ الـ assignee
                    if (assignee != null && !assignee.equals(decidedBy)) {
                        notificationService.sendToUser(assignee, new CaseNotification(
                            c.getId(), c.getReference(), c.getSubjectName(),
                            c.getStatus().name(), decision,
                            "DECISION", decidedBy, msg
                        ));
                    }

                    // أبلغ الـ creator لو مختلف عن الـ assignee والـ admin
                    if (creator != null
                            && !creator.equals(decidedBy)
                            && !creator.equals(assignee)) {
                        notificationService.sendToUser(creator, new CaseNotification(
                            c.getId(), c.getReference(), c.getSubjectName(),
                            c.getStatus().name(), decision,
                            "DECISION", decidedBy, msg
                        ));
                    }
                });
        } catch (Exception e) {
            // ما نوقف الـ transaction لو ما لاقى case
            log.warn("Could not send decision notification: {}", e.getMessage());
        }
    }

    private String buildDecisionMessage(String decision, String subject) {
        return switch (decision.toUpperCase()) {
            case "TRUE_MATCH"     -> "قرار: تطابق حقيقي — " + subject;
            case "FALSE_POSITIVE" -> "قرار: إيجابية كاذبة — " + subject;
            case "RISK_ACCEPTED"  -> "قرار: تم قبول المخاطرة — " + subject;
            case "PENDING_REVIEW" -> "القضية لا تزال قيد المراجعة — " + subject;
            default               -> "قرار جديد على القضية: " + subject;
        };
    }

    // ══════════════════════════════════════════
    //  آخر قرار على نتيجة معينة
    // ══════════════════════════════════════════
    public DecisionResponse getLatestDecision(String screeningType, Long screeningId) {
        return repository
            .findTopByScreeningTypeAndScreeningIdOrderByDecidedAtDesc(
                ScreeningType.valueOf(screeningType.toUpperCase()), screeningId)
            .map(this::toResponseWithDetails)
            .orElse(null);
    }

    // ══════════════════════════════════════════
    //  Audit Trail
    // ══════════════════════════════════════════
    public List<DecisionResponse> getAuditTrail(String screeningType, Long screeningId) {
        return repository
            .findByScreeningTypeAndScreeningIdOrderByDecidedAtDesc(
                ScreeningType.valueOf(screeningType.toUpperCase()), screeningId)
            .stream()
            .map(this::toResponseWithDetails)
            .toList();
    }

    // ══════════════════════════════════════════
    //  إحصائيات
    // ══════════════════════════════════════════
    public DecisionStatsResponse getStats() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return new DecisionStatsResponse(
                repository.countByDecision(Decision.DecisionType.TRUE_MATCH),
                repository.countByDecision(Decision.DecisionType.FALSE_POSITIVE),
                repository.countByDecision(Decision.DecisionType.PENDING_REVIEW),
                repository.countByDecision(Decision.DecisionType.RISK_ACCEPTED),
                repository.count()
            );
        }
        return new DecisionStatsResponse(
            repository.countByDecisionAndTenantId(Decision.DecisionType.TRUE_MATCH,     tenantId),
            repository.countByDecisionAndTenantId(Decision.DecisionType.FALSE_POSITIVE,  tenantId),
            repository.countByDecisionAndTenantId(Decision.DecisionType.PENDING_REVIEW,  tenantId),
            repository.countByDecisionAndTenantId(Decision.DecisionType.RISK_ACCEPTED,   tenantId),
            repository.countByTenantId(tenantId)
        );
    }

    // ══════════════════════════════════════════
    //  Helpers
    // ══════════════════════════════════════════
    private Decision getSecureDecision(Long id) {
        Decision d = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Decision not found: " + id));
        Long tenantId = TenantContext.getTenantId();
        if (tenantId != null && !tenantId.equals(d.getTenantId())) {
            throw new RuntimeException("Access denied to decision: " + id);
        }
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
            subjectName
        );
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
        } catch (Exception e) { return "—"; }
    }

    public List<DecisionResponse> getDecisionsForUser(String username) {
    Long tenantId = TenantContext.getTenantId();

    // جيب الـ cases المعينة للموظف
    List<com.sdn.blacklist.cases.entity.Case> myCases = tenantId != null
        ? caseRepository.findByAssignedToAndTenantIdOrderByCreatedAtDesc(
            username, tenantId, PageRequest.of(0, 100)).getContent()
        : caseRepository.findByAssignedToOrderByCreatedAtDesc(
            username, PageRequest.of(0, 100)).getContent();

    // جيب القرارات لكل case
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
        long total
    ) {}
}