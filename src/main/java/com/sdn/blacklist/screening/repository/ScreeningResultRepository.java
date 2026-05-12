package com.sdn.blacklist.screening.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.sdn.blacklist.screening.model.RiskLevel;
import com.sdn.blacklist.screening.model.ScreeningResult;

public interface ScreeningResultRepository extends JpaRepository<ScreeningResult, Long> {

    long countByRiskLevel(RiskLevel riskLevel);
    long countByRequest_CreatedBy_UsernameAndRiskLevel(String username, RiskLevel riskLevel);
    long countByTenantIdAndRiskLevel(Long tenantId, RiskLevel riskLevel);

    List<ScreeningResult> findTop5ByOrderByCreatedAtDesc();
    List<ScreeningResult> findTop20ByRequest_CreatedBy_UsernameOrderByCreatedAtDesc(String username);
    List<ScreeningResult> findTop50ByOrderByIdDesc();
    List<ScreeningResult> findTop5ByRequest_CreatedBy_UsernameOrderByCreatedAtDesc(String username);
    List<ScreeningResult> findAllByOrderByCreatedAtDesc();
    List<ScreeningResult> findByTenantIdOrderByCreatedAtDesc(Long tenantId);

    @Query("SELECT r FROM ScreeningResult r LEFT JOIN FETCH r.matches WHERE r.id = :id")
    Optional<ScreeningResult> findByIdWithMatches(@Param("id") Long id);

    @Query("""
        SELECT r FROM ScreeningResult r
        LEFT JOIN FETCH r.request req
        LEFT JOIN FETCH req.createdBy
        WHERE r.createdAt IS NOT NULL
        ORDER BY r.createdAt DESC
    """)
    List<ScreeningResult> findTop10WithDetailsOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT r FROM ScreeningResult r WHERE r.request.createdBy.username = :username ORDER BY r.createdAt DESC")
    List<ScreeningResult> findByCreatedByUsername(@Param("username") String username);

    @Query("SELECT r FROM ScreeningResult r WHERE r.request.createdBy.username = :username AND r.tenantId = :tenantId ORDER BY r.createdAt DESC")
    List<ScreeningResult> findByCreatedByUsernameAndTenantId(@Param("username") String username, @Param("tenantId") Long tenantId);

    @Query("""
        SELECT r FROM ScreeningResult r
        LEFT JOIN FETCH r.request req
        LEFT JOIN FETCH req.createdBy
        WHERE r.tenantId = :tenantId
        ORDER BY r.createdAt DESC
    """)
    List<ScreeningResult> findTop10ByTenantIdOrderByCreatedAtDesc(@Param("tenantId") Long tenantId, Pageable pageable);

    //  Monthly matches — SUPER_ADMIN
    @Query(value = """
        SELECT TO_CHAR(sr.created_at, 'Mon') as month,
               EXTRACT(MONTH FROM sr.created_at) as month_num,
               COUNT(*) as matches
        FROM screening_result sr
        WHERE sr.created_at >= :from
          AND sr.risk_level IN ('MEDIUM','HIGH','CRITICAL')
        GROUP BY TO_CHAR(sr.created_at, 'Mon'), EXTRACT(MONTH FROM sr.created_at)
        ORDER BY EXTRACT(MONTH FROM sr.created_at)
        """, nativeQuery = true)
    List<Object[]> countMonthlyMatches(@Param("from") LocalDateTime from);

    //  Monthly matches — COMPANY_ADMIN
    @Query(value = """
        SELECT TO_CHAR(sr.created_at, 'Mon') as month,
               EXTRACT(MONTH FROM sr.created_at) as month_num,
               COUNT(*) as matches
        FROM screening_result sr
        WHERE sr.created_at >= :from
          AND sr.tenant_id = :tenantId
          AND sr.risk_level IN ('MEDIUM','HIGH','CRITICAL')
        GROUP BY TO_CHAR(sr.created_at, 'Mon'), EXTRACT(MONTH FROM sr.created_at)
        ORDER BY EXTRACT(MONTH FROM sr.created_at)
        """, nativeQuery = true)
    List<Object[]> countMonthlyMatchesByTenant(@Param("from") LocalDateTime from,
                                               @Param("tenantId") Long tenantId);

    //  Monthly matches — SUBSCRIBER
    @Query(value = """
        SELECT TO_CHAR(sr.created_at, 'Mon') as month,
               EXTRACT(MONTH FROM sr.created_at) as month_num,
               COUNT(*) as matches
        FROM screening_result sr
        JOIN screening_request req ON sr.request_id = req.id
        JOIN users u ON req.created_by_id = u.id
        WHERE sr.created_at >= :from
          AND u.username = :username
          AND sr.risk_level IN ('MEDIUM','HIGH','CRITICAL')
        GROUP BY TO_CHAR(sr.created_at, 'Mon'), EXTRACT(MONTH FROM sr.created_at)
        ORDER BY EXTRACT(MONTH FROM sr.created_at)
        """, nativeQuery = true)
    List<Object[]> countMonthlyMatchesByUser(@Param("from") LocalDateTime from,
                                             @Param("username") String username);

    //  Top sources من الـ matches — SUPER_ADMIN
    @Query(value = """
        SELECT m.source, COUNT(*) as cnt
        FROM screening_match m
        JOIN screening_result sr ON m.result_id = sr.id
        WHERE m.source IS NOT NULL AND m.source != ''
          AND sr.created_at >= :from
        GROUP BY m.source
        ORDER BY cnt DESC
        LIMIT 6
        """, nativeQuery = true)
    List<Object[]> findTopCountries(@Param("from") LocalDateTime from);

    //  Top sources — COMPANY_ADMIN
    @Query(value = """
        SELECT m.source, COUNT(*) as cnt
        FROM screening_match m
        JOIN screening_result sr ON m.result_id = sr.id
        WHERE m.source IS NOT NULL AND m.source != ''
          AND sr.tenant_id = :tenantId
          AND sr.created_at >= :from
        GROUP BY m.source
        ORDER BY cnt DESC
        LIMIT 6
        """, nativeQuery = true)
    List<Object[]> findTopCountriesByTenant(@Param("from") LocalDateTime from,
                                            @Param("tenantId") Long tenantId);


    long countByRiskLevelAndCreatedAtAfter(
    com.sdn.blacklist.screening.model.RiskLevel riskLevel, 
    java.time.LocalDateTime after
);
}