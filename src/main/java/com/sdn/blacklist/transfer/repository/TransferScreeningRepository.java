package com.sdn.blacklist.transfer.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.sdn.blacklist.transfer.entity.TransferScreeningRecord;
import com.sdn.blacklist.transfer.entity.TransferScreeningRecord.ScreeningAction;

@Repository
public interface TransferScreeningRepository extends JpaRepository<TransferScreeningRecord, Long> {

    // ══════════════════════════════════════════
    //  بحث أساسي
    // ══════════════════════════════════════════
    Optional<TransferScreeningRecord> findByReference(String reference);

    Optional<TransferScreeningRecord> findTopByOrderByIdDesc();

    Page<TransferScreeningRecord> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // ══════════════════════════════════════════
    //  عزل: على مستوى المستخدم (نفسه بس)
    // ══════════════════════════════════════════
    Page<TransferScreeningRecord> findByCreatedByOrderByCreatedAtDesc(
        String createdBy, Pageable pageable);

    Page<TransferScreeningRecord> findByCreatedByAndTenantIdOrderByCreatedAtDesc(
        String createdBy, Long tenantId, Pageable p);

    // ══════════════════════════════════════════
    //  عزل: على مستوى الشركة (tenant)
    // ══════════════════════════════════════════
    Page<TransferScreeningRecord> findByTenantIdOrderByCreatedAtDesc(
        Long tenantId, Pageable p);

    // ══════════════════════════════════════════
    //  عزل: على مستوى الفرع (tenant + branch)
    // ══════════════════════════════════════════
    Page<TransferScreeningRecord> findByTenantIdAndBranchIdOrderByCreatedAtDesc(
        Long tenantId, Long branchId, Pageable p);

    // ══════════════════════════════════════════
    //  إحصائيات — عام
    // ══════════════════════════════════════════
    long countByAction(ScreeningAction action);

    @Query("SELECT COUNT(t) FROM TransferScreeningRecord t WHERE t.createdAt >= :start AND t.createdAt < :end")
    long countToday(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("""
        SELECT t.action, COUNT(t)
        FROM TransferScreeningRecord t
        GROUP BY t.action
    """)
    List<Object[]> countGroupByAction();

    // ══════════════════════════════════════════
    //  إحصائيات — حسب المستخدم
    // ══════════════════════════════════════════
    long countByCreatedBy(String createdBy);

    long countByCreatedByAndAction(String createdBy, ScreeningAction action);

    @Query("SELECT COUNT(t) FROM TransferScreeningRecord t WHERE t.createdBy = :user AND t.createdAt >= :start AND t.createdAt < :end")
    long countTodayByUser(@Param("user") String user,
                          @Param("start") LocalDateTime start,
                          @Param("end") LocalDateTime end);

    // ══════════════════════════════════════════
    //  إحصائيات — حسب الشركة (tenant)
    // ══════════════════════════════════════════
    long countByTenantId(Long tenantId);

    long countByActionAndTenantId(ScreeningAction action, Long tenantId);

    @Query("SELECT COUNT(t) FROM TransferScreeningRecord t WHERE t.tenantId = :tenantId AND t.createdAt BETWEEN :start AND :end")
    long countTodayByTenant(@Param("tenantId") Long tenantId,
                            @Param("start") LocalDateTime start,
                            @Param("end") LocalDateTime end);

    // ══════════════════════════════════════════
    //  إحصائيات — حسب الفرع (tenant + branch)
    // ══════════════════════════════════════════
    long countByTenantIdAndBranchId(Long tenantId, Long branchId);

    long countByTenantIdAndBranchIdAndAction(Long tenantId, Long branchId, ScreeningAction action);

    @Query("SELECT COUNT(t) FROM TransferScreeningRecord t WHERE t.tenantId = :tenantId AND t.branchId = :branchId AND t.createdAt >= :start AND t.createdAt < :end")
    long countTodayByTenantAndBranch(@Param("tenantId") Long tenantId,
                                     @Param("branchId") Long branchId,
                                     @Param("start") LocalDateTime start,
                                     @Param("end") LocalDateTime end);

    // ══════════════════════════════════════════
    //  توليد المرجع (reference sequence)
    // ══════════════════════════════════════════
    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(t.reference, 14) AS long)), 0) FROM TransferScreeningRecord t WHERE t.reference LIKE CONCAT('SCR-', :date, '-%')")
    long findMaxSequenceForDate(@Param("date") String date);

    default long findMaxSequence() {
        // اقرأ آخر reference من DB واستخرج الرقم
        return findTopByOrderByIdDesc()
            .map(r -> {
                try {
                    String[] parts = r.getReference().split("-");
                    return Long.parseLong(parts[parts.length - 1]);
                } catch (Exception e) { return 0L; }
            }).orElse(0L);
    }
}