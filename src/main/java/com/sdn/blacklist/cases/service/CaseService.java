package com.sdn.blacklist.cases.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

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
import com.sdn.blacklist.tenant.context.TenantContext;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class CaseService {

    private final CaseRepository repository;

    // ══════════════════════════════════════════
    //  إنشاء Case
    // ══════════════════════════════════════════
    @Transactional
    public CaseResponse createCase(CaseRequest req, String username) {

        CaseType caseType = CaseType.valueOf(req.getCaseType().toUpperCase());
        Long tenantId = TenantContext.getTenantId();

        repository.findByScreeningIdAndCaseType(req.getScreeningId(), caseType)
            .ifPresent(existing -> {
                throw new RuntimeException("Case already exists: #" + existing.getId());
            });

        Case c = Case.builder()
            .caseType(caseType)
            .screeningId(req.getScreeningId())
            .subjectName(req.getSubjectName())
            .reference(generateReference())
            .status(CaseStatus.OPEN)
            .priority(req.getPriority() != null
                ? CasePriority.valueOf(req.getPriority().toUpperCase())
                : CasePriority.MEDIUM)
            .assignedTo(null)
            .createdBy(username)
            .notes(req.getNotes())
            .tenantId(tenantId)          
            .dueDate(req.getDueDate() != null
                ? LocalDateTime.parse(req.getDueDate(), DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                : LocalDateTime.now().plusDays(3))
            .createdAt(LocalDateTime.now())
            .build();

        Case saved = repository.save(c);
        log.info("✅ Case #{} created — {} #{} by {} [tenant:{}]",
            saved.getId(), saved.getCaseType(), saved.getScreeningId(), username, tenantId);

        return toResponse(saved);
    }

    // ══════════════════════════════════════════
    //  تحديث الحالة
    // ══════════════════════════════════════════
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
        log.info("✅ Case #{} → {} by {}", id, newStatus, username);
        return toResponse(saved);
    }

    // ══════════════════════════════════════════
    //  تعديل الـ Case
    // ══════════════════════════════════════════
    @Transactional
    public CaseResponse updateCase(Long id, CaseRequest req, String username) {
        Case c = getSecureCase(id);

        if (req.getPriority()   != null) c.setPriority(CasePriority.valueOf(req.getPriority().toUpperCase()));
        if (req.getAssignedTo() != null) c.setAssignedTo(req.getAssignedTo());
        if (req.getNotes()      != null) c.setNotes(req.getNotes());
        if (req.getDueDate()    != null) c.setDueDate(
            LocalDateTime.parse(req.getDueDate(), DateTimeFormatter.ISO_LOCAL_DATE_TIME));

        c.setUpdatedAt(LocalDateTime.now());
        return toResponse(repository.save(c));
    }

    // ══════════════════════════════════════════
    //  جلب الـ Cases — مع tenant filter
    // ══════════════════════════════════════════

    // SUPER_ADMIN → يشوف الكل | غيره → tenant فقط
    public Page<CaseResponse> getAll(int page, int size) {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            // SUPER_ADMIN
            return repository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size))
                .map(this::toResponse);
        }
        return repository.findByTenantIdOrderByCreatedAtDesc(tenantId, PageRequest.of(page, size))
            .map(this::toResponse);
    }

    public Page<CaseResponse> getByCreator(String username, int page, int size) {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return repository.findByCreatedByOrderByCreatedAtDesc(username, PageRequest.of(page, size))
                .map(this::toResponse);
        }
        return repository.findByCreatedByAndTenantIdOrderByCreatedAtDesc(
            username, tenantId, PageRequest.of(page, size))
            .map(this::toResponse);
    }

    public Page<CaseResponse> getByStatus(String status, int page, int size) {
        Long tenantId = TenantContext.getTenantId();
        CaseStatus caseStatus = CaseStatus.valueOf(status.toUpperCase());
        if (tenantId == null) {
            return repository.findByStatusOrderByCreatedAtDesc(caseStatus, PageRequest.of(page, size))
                .map(this::toResponse);
        }
        return repository.findByStatusAndTenantIdOrderByCreatedAtDesc(
            caseStatus, tenantId, PageRequest.of(page, size))
            .map(this::toResponse);
    }

    public Page<CaseResponse> getByAssignee(String username, int page, int size) {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return repository.findByAssignedToOrderByCreatedAtDesc(username, PageRequest.of(page, size))
                .map(this::toResponse);
        }
        return repository.findByAssignedToAndTenantIdOrderByCreatedAtDesc(
            username, tenantId, PageRequest.of(page, size))
            .map(this::toResponse);
    }

    public Page<CaseResponse> search(String query, int page, int size) {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return repository.search(query, PageRequest.of(page, size)).map(this::toResponse);
        }
        return repository.searchByTenant(query, tenantId, PageRequest.of(page, size))
            .map(this::toResponse);
    }

    public CaseResponse getById(Long id) {
        return toResponse(getSecureCase(id));
    }

    // ══════════════════════════════════════════
    //  إحصائيات — مع tenant filter
    // ══════════════════════════════════════════
    public CaseStatsResponse getStats() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            // SUPER_ADMIN — كل الإحصائيات
            return new CaseStatsResponse(
                repository.count(),
                repository.countByStatus(CaseStatus.OPEN),
                repository.countByStatus(CaseStatus.IN_REVIEW),
                repository.countByStatus(CaseStatus.ESCALATED),
                repository.countByStatus(CaseStatus.CLOSED),
                repository.countByPriority(CasePriority.CRITICAL),
                repository.findOverdueCases().size()
            );
        }
        // Tenant — إحصائيات الشركة فقط
        return new CaseStatsResponse(
            repository.countByTenantId(tenantId),
            repository.countByStatusAndTenantId(CaseStatus.OPEN,      tenantId),
            repository.countByStatusAndTenantId(CaseStatus.IN_REVIEW,  tenantId),
            repository.countByStatusAndTenantId(CaseStatus.ESCALATED,  tenantId),
            repository.countByStatusAndTenantId(CaseStatus.CLOSED,     tenantId),
            repository.countByPriorityAndTenantId(CasePriority.CRITICAL, tenantId),
            repository.findOverdueCasesByTenant(tenantId).size()
        );
    }

    public CaseStatsResponse getStatsByCreator(String username) {
        Long tenantId = TenantContext.getTenantId();
        return new CaseStatsResponse(
            repository.countByCreatedBy(username),
            repository.countByCreatedByAndStatus(username, CaseStatus.OPEN),
            repository.countByCreatedByAndStatus(username, CaseStatus.IN_REVIEW),
            repository.countByCreatedByAndStatus(username, CaseStatus.ESCALATED),
            repository.countByCreatedByAndStatus(username, CaseStatus.CLOSED),
            repository.countByCreatedByAndPriority(username, CasePriority.CRITICAL),
            repository.findOverdueCasesByCreator(username).size()
        );
    }

    // ══════════════════════════════════════════
    //  Helpers
    // ══════════════════════════════════════════

    // تأكد إن الـ case ينتمي لنفس الـ tenant
    private Case getSecureCase(Long id) {
        Case c = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Case not found: " + id));

        Long tenantId = TenantContext.getTenantId();
        if (tenantId != null && !tenantId.equals(c.getTenantId())) {
            throw new RuntimeException("Access denied to case: " + id);
        }
        return c;
    }

    private String generateReference() {
        String year = String.valueOf(LocalDateTime.now().getYear());
        String seq  = String.format("%05d", System.currentTimeMillis() % 100000);
        return "CASE-" + year + "-" + seq;
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