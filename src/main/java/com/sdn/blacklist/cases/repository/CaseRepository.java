package com.sdn.blacklist.cases.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.sdn.blacklist.cases.entity.Case;
import com.sdn.blacklist.cases.entity.CasePriority;
import com.sdn.blacklist.cases.entity.CaseStatus;
import com.sdn.blacklist.cases.entity.CaseType;

public interface CaseRepository extends JpaRepository<Case, Long> {

    // ── Existing ──────────────────────────────────────────────────────────────
    Optional<Case> findByScreeningIdAndCaseType(Long screeningId, CaseType caseType);

    Page<Case> findAllByOrderByCreatedAtDesc(Pageable p);
    Page<Case> findByCreatedByOrderByCreatedAtDesc(String createdBy, Pageable p);
    Page<Case> findByStatusOrderByCreatedAtDesc(CaseStatus status, Pageable p);
    Page<Case> findByAssignedToOrderByCreatedAtDesc(String assignedTo, Pageable p);

    long countByStatus(CaseStatus status);
    long countByPriority(CasePriority priority);
    long countByCreatedBy(String createdBy);
    long countByCreatedByAndStatus(String createdBy, CaseStatus status);
    long countByCreatedByAndPriority(String createdBy, CasePriority priority);

    @Query("SELECT c FROM Case c WHERE c.dueDate < :now AND c.status != 'CLOSED'")
    List<Case> findOverdueCases(@Param("now") LocalDateTime now);

    default List<Case> findOverdueCases() {
        return findOverdueCases(LocalDateTime.now());
    }

    @Query("SELECT c FROM Case c WHERE c.createdBy = :user AND c.dueDate < :now AND c.status != 'CLOSED'")
    List<Case> findOverdueCasesByCreator(@Param("user") String user, @Param("now") LocalDateTime now);

    default List<Case> findOverdueCasesByCreator(String user) {
        return findOverdueCasesByCreator(user, LocalDateTime.now());
    }

    @Query("SELECT c FROM Case c WHERE LOWER(c.subjectName) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(c.reference) LIKE LOWER(CONCAT('%',:q,'%'))")
    Page<Case> search(@Param("q") String query, Pageable p);

    // ── Tenant-aware ──────────────────────────────────────────────────────────

    Page<Case> findByTenantIdOrderByCreatedAtDesc(Long tenantId, Pageable p);

    Page<Case> findByCreatedByAndTenantIdOrderByCreatedAtDesc(String createdBy, Long tenantId, Pageable p);

    Page<Case> findByStatusAndTenantIdOrderByCreatedAtDesc(CaseStatus status, Long tenantId, Pageable p);

    Page<Case> findByAssignedToAndTenantIdOrderByCreatedAtDesc(String assignedTo, Long tenantId, Pageable p);

    long countByTenantId(Long tenantId);
    long countByStatusAndTenantId(CaseStatus status, Long tenantId);
    long countByPriorityAndTenantId(CasePriority priority, Long tenantId);

    @Query("SELECT c FROM Case c WHERE c.tenantId = :tenantId AND c.dueDate < :now AND c.status != 'CLOSED'")
    List<Case> findOverdueCasesByTenant(@Param("tenantId") Long tenantId, @Param("now") LocalDateTime now);

    default List<Case> findOverdueCasesByTenant(Long tenantId) {
        return findOverdueCasesByTenant(tenantId, LocalDateTime.now());
    }

    @Query("SELECT c FROM Case c WHERE c.tenantId = :tenantId AND (LOWER(c.subjectName) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(c.reference) LIKE LOWER(CONCAT('%',:q,'%')))")
    Page<Case> searchByTenant(@Param("q") String query, @Param("tenantId") Long tenantId, Pageable p);
}