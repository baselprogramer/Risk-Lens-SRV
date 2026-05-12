package com.sdn.blacklist.screening.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.sdn.blacklist.screening.model.ScreeningRequest;

@Repository
public interface ScreeningRequestRepository extends JpaRepository<ScreeningRequest, Long> {

    long countByCreatedBy_Username(String username);
    List<ScreeningRequest> findTop5ByCreatedBy_UsernameOrderByCreatedAtDesc(String username);
    long countByCreatedAtAfter(LocalDateTime date);
    long countByCreatedBy_UsernameAndCreatedAtAfter(String username, LocalDateTime date);
    long countByTenantId(Long tenantId);
    long countByTenantIdAndCreatedAtAfter(Long tenantId, LocalDateTime after);

    @Query("SELECT r.request FROM ScreeningResult r WHERE r.id = :resultId")
    Optional<ScreeningRequest> findByResultId(@Param("resultId") Long resultId);

    //  Monthly searches — SUPER_ADMIN
    @Query(value = """
        SELECT TO_CHAR(created_at, 'Mon') as month,
               EXTRACT(MONTH FROM created_at) as month_num,
               COUNT(*) as searches
        FROM screening_request
        WHERE created_at >= :from
        GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
        ORDER BY EXTRACT(MONTH FROM created_at)
        """, nativeQuery = true)
    List<Object[]> countMonthlySearches(@Param("from") LocalDateTime from);

    //  Monthly searches — COMPANY_ADMIN
    @Query(value = """
        SELECT TO_CHAR(created_at, 'Mon') as month,
               EXTRACT(MONTH FROM created_at) as month_num,
               COUNT(*) as searches
        FROM screening_request
        WHERE created_at >= :from AND tenant_id = :tenantId
        GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
        ORDER BY EXTRACT(MONTH FROM created_at)
        """, nativeQuery = true)
    List<Object[]> countMonthlySearchesByTenant(@Param("from") LocalDateTime from,
                                                @Param("tenantId") Long tenantId);

    //  Monthly searches — SUBSCRIBER
    @Query(value = """
        SELECT TO_CHAR(r.created_at, 'Mon') as month,
               EXTRACT(MONTH FROM r.created_at) as month_num,
               COUNT(*) as searches
        FROM screening_request r
        JOIN users u ON r.created_by_id = u.id
        WHERE r.created_at >= :from AND u.username = :username
        GROUP BY TO_CHAR(r.created_at, 'Mon'), EXTRACT(MONTH FROM r.created_at)
        ORDER BY EXTRACT(MONTH FROM r.created_at)
        """, nativeQuery = true)
    List<Object[]> countMonthlySearchesByUser(@Param("from") LocalDateTime from,
                                              @Param("username") String username);
}