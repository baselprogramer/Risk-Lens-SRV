package com.sdn.blacklist.transfer.repository;

import java.time.LocalDateTime;
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

    Optional<TransferScreeningRecord> findByReference(String reference);

    Page<TransferScreeningRecord> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // إحصائيات
    long countByAction(ScreeningAction action);

    @Query("SELECT COUNT(t) FROM TransferScreeningRecord t WHERE t.createdAt >= :start AND t.createdAt < :end")
    long countToday(@Param("start") java.time.LocalDateTime start, @Param("end") java.time.LocalDateTime end);

    @Query("""
        SELECT t.action, COUNT(t)
        FROM TransferScreeningRecord t
        GROUP BY t.action
    """)
    java.util.List<Object[]> countGroupByAction();


    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(t.reference, 14) AS long)), 0) FROM TransferScreeningRecord t WHERE t.reference LIKE CONCAT('SCR-', :date, '-%')")
    long findMaxSequenceForDate(@Param("date") String date);

// أو الأبسط — بدون date filter
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

Optional<TransferScreeningRecord> findTopByOrderByIdDesc();

Page<TransferScreeningRecord> findByCreatedByOrderByCreatedAtDesc(String createdBy, Pageable pageable);

long countByCreatedBy(String createdBy);
long countByCreatedByAndAction(String createdBy, ScreeningAction action);

@Query("SELECT COUNT(t) FROM TransferScreeningRecord t WHERE t.createdBy = :user AND t.createdAt >= :start AND t.createdAt < :end")
long countTodayByUser(@Param("user") String user, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);


Page<TransferScreeningRecord> findByTenantIdOrderByCreatedAtDesc(Long tenantId, Pageable p);
 
Page<TransferScreeningRecord> findByCreatedByAndTenantIdOrderByCreatedAtDesc(
    String createdBy, Long tenantId, Pageable p);
 
long countByTenantId(Long tenantId);
 
long countByActionAndTenantId(
    TransferScreeningRecord.ScreeningAction action, Long tenantId);
 
@Query("SELECT COUNT(t) FROM TransferScreeningRecord t WHERE t.tenantId = :tenantId AND t.createdAt BETWEEN :start AND :end")
long countTodayByTenant(
    @Param("tenantId") Long tenantId,
    @Param("start") LocalDateTime start,
    @Param("end") LocalDateTime end);
 
}