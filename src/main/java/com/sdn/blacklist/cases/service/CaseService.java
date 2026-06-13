package com.sdn.blacklist.cases.service;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sdn.blacklist.cases.dto.CaseRequest;
import com.sdn.blacklist.cases.dto.CaseResponse;
import com.sdn.blacklist.cases.dto.CaseStatsResponse;
import com.sdn.blacklist.cases.entity.Case;
import com.sdn.blacklist.cases.entity.CasePriority;
import com.sdn.blacklist.cases.entity.CaseStatus;
import com.sdn.blacklist.cases.entity.CaseType;
import com.sdn.blacklist.cases.repository.CaseRepository;
import com.sdn.blacklist.notifications.NotificationService;
import com.sdn.blacklist.notifications.NotificationService.CaseNotification;
import com.sdn.blacklist.tenant.context.TenantContext;
import com.sdn.blacklist.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CaseService {

    private final CaseRepository repository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public CaseResponse createCase(CaseRequest req, String username) {

        CaseType caseType = CaseType.valueOf(req.getCaseType().toUpperCase());
        Long tenantId = TenantContext.getTenantId();

        // ✅ تحقق من duplicate فقط لو في screeningId
        if (req.getScreeningId() != null) {
            repository.findByScreeningIdAndCaseType(req.getScreeningId(), caseType)
                    .ifPresent(existing -> {
                        throw new RuntimeException("Case already exists: #" + existing.getId());
                    });
        }

        Case c = Case.builder()
                .caseType(caseType)
                .screeningId(req.getScreeningId())
                .subjectName(req.getSubjectName())
                .reference(generateReference())
                .status(CaseStatus.OPEN)
                .priority(req.getPriority() != null
                        ? CasePriority.valueOf(req.getPriority().toUpperCase())
                        : CasePriority.MEDIUM)
                .assignedTo(username)
                .createdBy(username)
                // ✅ suspicionReason بيأخذ أولوية على notes
                .notes(req.getSuspicionReason() != null
                        ? req.getSuspicionReason()
                        : req.getNotes())
                .tenantId(tenantId)
                .dueDate(req.getDueDate() != null
                        ? req.getDueDate()
                        : LocalDateTime.now().plusDays(3))
                .createdAt(LocalDateTime.now())
                .build();

        Case saved = repository.save(c);
        log.info(" Case #{} created — {} #{} by {} [tenant:{}]",
                saved.getId(), saved.getCaseType(), saved.getScreeningId(), username, tenantId);

        if (tenantId != null) {
            userRepository.findByTenantId(tenantId).stream()
                    .filter(u -> {
                        String role = u.getRole() != null ? u.getRole().name() : "";
                        return role.equals("COMPANY_ADMIN") || role.equals("SUPER_ADMIN");
                    })
                    .filter(u -> !u.getUsername().equals(username))
                    .forEach(admin -> notificationService.sendToUser(
                            admin.getUsername(),
                            new CaseNotification(
                                    saved.getId(),
                                    saved.getReference(),
                                    saved.getSubjectName(),
                                    saved.getStatus().name(),
                                    null,
                                    "NEW_CASE",
                                    username,
                                    "حالة جديدة من " + username + ": " + saved.getSubjectName())));
        }

        return toResponse(saved);
    }

    @Transactional
    public CaseResponse updateStatus(Long id, String newStatus, String resolution, String username) {
        Case c = getSecureCase(id);

        CaseStatus status = CaseStatus.valueOf(newStatus.toUpperCase());
        c.setStatus(status);
        c.setUpdatedAt(LocalDateTime.now());

        if (status == CaseStatus.CLOSED) {
            c.setClosedAt(LocalDateTime.now());
            c.setResolution(resolution);
        }

        Case saved = repository.save(c);
        log.info(" Case #{} → {} by {}", id, newStatus, username);

        String assignee = saved.getAssignedTo();
        if (assignee != null && !assignee.equals(username)) {
            String msg = buildStatusMessage(newStatus, saved.getSubjectName(), resolution);
            notificationService.sendToUser(assignee, new CaseNotification(
                    saved.getId(),
                    saved.getReference(),
                    saved.getSubjectName(),
                    newStatus,
                    null,
                    "STATUS_UPDATE",
                    username,
                    msg));
        }

        return toResponse(saved);
    }

    @Transactional
    public CaseResponse updateCase(Long id, CaseRequest req, String username) {
        Case c = getSecureCase(id);

        if (req.getPriority() != null)
            c.setPriority(CasePriority.valueOf(req.getPriority().toUpperCase()));
        if (req.getAssignedTo() != null)
            c.setAssignedTo(req.getAssignedTo());
        if (req.getNotes() != null)
            c.setNotes(req.getNotes());
        if (req.getDueDate() != null)
            c.setDueDate(req.getDueDate());

        c.setUpdatedAt(LocalDateTime.now());
        return toResponse(repository.save(c));
    }

    public void notifyDecision(Long caseId, String decision, String decidedBy) {
        repository.findById(caseId).ifPresent(c -> {
            String assignee = c.getAssignedTo();
            String creator = c.getCreatedBy();

            for (String target : new String[] { assignee, creator }) {
                if (target != null && !target.equals(decidedBy)) {
                    String msg = buildDecisionMessage(decision, c.getSubjectName());
                    notificationService.sendToUser(target, new CaseNotification(
                            c.getId(),
                            c.getReference(),
                            c.getSubjectName(),
                            c.getStatus().name(),
                            decision,
                            "DECISION",
                            decidedBy,
                            msg));
                }
            }
        });
    }

    public Page<CaseResponse> getAll(int page, int size) {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null)
            return repository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size)).map(this::toResponse);
        return repository.findByTenantIdOrderByCreatedAtDesc(tenantId, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    public Page<CaseResponse> getByCreator(String username, int page, int size) {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null)
            return repository.findByCreatedByOrderByCreatedAtDesc(username, PageRequest.of(page, size))
                    .map(this::toResponse);
        return repository.findByCreatedByAndTenantIdOrderByCreatedAtDesc(username, tenantId, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    public Page<CaseResponse> getByStatus(String status, int page, int size) {
        Long tenantId = TenantContext.getTenantId();
        CaseStatus caseStatus = CaseStatus.valueOf(status.toUpperCase());
        if (tenantId == null)
            return repository.findByStatusOrderByCreatedAtDesc(caseStatus, PageRequest.of(page, size))
                    .map(this::toResponse);
        return repository.findByStatusAndTenantIdOrderByCreatedAtDesc(caseStatus, tenantId, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    public Page<CaseResponse> getByAssignee(String username, int page, int size) {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null)
            return repository.findByAssignedToOrderByCreatedAtDesc(username, PageRequest.of(page, size))
                    .map(this::toResponse);
        return repository
                .findByAssignedToAndTenantIdOrderByCreatedAtDesc(username, tenantId, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    public Page<CaseResponse> search(String query, int page, int size) {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null)
            return repository.search(query, PageRequest.of(page, size)).map(this::toResponse);
        return repository.searchByTenant(query, tenantId, PageRequest.of(page, size)).map(this::toResponse);
    }

    public CaseResponse getById(Long id) {
        return toResponse(getSecureCase(id));
    }

    @Transactional
    public CaseResponse assignCase(Long id, String assignToUsername, String adminUsername) {
        Case c = getSecureCase(id);
        Long tenantId = c.getTenantId();

        if (!userRepository.existsByUsernameAndTenantId(assignToUsername, tenantId))
            throw new RuntimeException("User not found in your organization: " + assignToUsername);

        c.setAssignedTo(assignToUsername);
        c.setUpdatedAt(LocalDateTime.now());
        Case saved = repository.save(c);

        log.info(" Case #{} assigned to {} by {}", id, assignToUsername, adminUsername);

        notificationService.sendToUser(assignToUsername, new CaseNotification(
                saved.getId(), saved.getReference(), saved.getSubjectName(),
                saved.getStatus().name(), null, "ASSIGNED", adminUsername,
                "تم تعيين قضية جديدة إليك: " + saved.getSubjectName()));

        return toResponse(saved);
    }

    public CaseStatsResponse getStats() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return new CaseStatsResponse(
                    repository.count(),
                    repository.countByStatus(CaseStatus.OPEN),
                    repository.countByStatus(CaseStatus.IN_REVIEW),
                    repository.countByStatus(CaseStatus.ESCALATED),
                    repository.countByStatus(CaseStatus.CLOSED),
                    repository.countByPriority(CasePriority.CRITICAL),
                    repository.findOverdueCases().size());
        }
        return new CaseStatsResponse(
                repository.countByTenantId(tenantId),
                repository.countByStatusAndTenantId(CaseStatus.OPEN, tenantId),
                repository.countByStatusAndTenantId(CaseStatus.IN_REVIEW, tenantId),
                repository.countByStatusAndTenantId(CaseStatus.ESCALATED, tenantId),
                repository.countByStatusAndTenantId(CaseStatus.CLOSED, tenantId),
                repository.countByPriorityAndTenantId(CasePriority.CRITICAL, tenantId),
                repository.findOverdueCasesByTenant(tenantId).size());
    }

    public CaseStatsResponse getStatsByCreator(String username) {
        return new CaseStatsResponse(
                repository.countByCreatedBy(username),
                repository.countByCreatedByAndStatus(username, CaseStatus.OPEN),
                repository.countByCreatedByAndStatus(username, CaseStatus.IN_REVIEW),
                repository.countByCreatedByAndStatus(username, CaseStatus.ESCALATED),
                repository.countByCreatedByAndStatus(username, CaseStatus.CLOSED),
                repository.countByCreatedByAndPriority(username, CasePriority.CRITICAL),
                repository.findOverdueCasesByCreator(username).size());
    }

    private Case getSecureCase(Long id) {
        Case c = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Case not found: " + id));
        Long tenantId = TenantContext.getTenantId();
        if (tenantId != null && !tenantId.equals(c.getTenantId()))
            throw new RuntimeException("Access denied to case: " + id);
        return c;
    }

    private String generateReference() {
        String year = String.valueOf(LocalDateTime.now().getYear());
        String seq = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return "CASE-" + year + "-" + seq;
    }

    private String buildStatusMessage(String status, String subject, String resolution) {
        return switch (status.toUpperCase()) {
            case "CLOSED" -> "تم إغلاق قضية: " + subject + (resolution != null ? " — " + resolution : "");
            case "IN_REVIEW" -> "قضيتك قيد المراجعة: " + subject;
            case "ESCALATED" -> "تم تصعيد القضية: " + subject;
            default -> "تحديث على القضية: " + subject;
        };
    }

    private String buildDecisionMessage(String decision, String subject) {
        return switch (decision.toUpperCase()) {
            case "TRUE_MATCH" -> "قرار: تطابق حقيقي للقضية — " + subject;
            case "FALSE_POSITIVE" -> "قرار: إيجابية كاذبة — " + subject;
            case "RISK_ACCEPTED" -> "قرار: تم قبول المخاطرة — " + subject;
            case "PENDING_REVIEW" -> "القضية لا تزال قيد المراجعة — " + subject;
            default -> "قرار جديد على القضية: " + subject;
        };
    }

    private CaseResponse toResponse(Case c) {
        CaseResponse r = new CaseResponse();
        r.setId(c.getId());
        r.setCaseType(c.getCaseType().name());
        r.setScreeningId(c.getScreeningId());
        r.setSubjectName(c.getSubjectName());
        r.setReference(c.getReference());
        r.setStatus(c.getStatus().name());
        r.setPriority(c.getPriority() != null ? c.getPriority().name() : null);
        r.setAssignedTo(c.getAssignedTo());
        r.setCreatedBy(c.getCreatedBy());
        r.setNotes(c.getNotes());
        r.setResolution(c.getResolution());
        r.setRiskLevel(c.getRiskLevel());
        r.setMatchCount(c.getMatchCount());
        r.setCreatedAt(c.getCreatedAt());
        r.setUpdatedAt(c.getUpdatedAt());
        r.setClosedAt(c.getClosedAt());
        r.setDueDate(c.getDueDate());
        return r;
    }
}