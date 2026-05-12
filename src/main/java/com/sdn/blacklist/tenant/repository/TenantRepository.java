package com.sdn.blacklist.tenant.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.sdn.blacklist.tenant.entity.Tenant;

public interface TenantRepository extends JpaRepository<Tenant, Long> {

    Optional<Tenant> findByCode(String code);
    List<Tenant> findAllByOrderByCreatedAtDesc();
    List<Tenant> findByActiveTrue();
    long countByActive(boolean active);

    @Query("SELECT t FROM Tenant t WHERE t.expiresAt < CURRENT_TIMESTAMP AND t.active = true")
    List<Tenant> findExpiredTenants();

    //  زيادة عداد الطلبات بشكل atomic
    @Modifying
    @Query("UPDATE Tenant t SET t.requestsToday = t.requestsToday + 1 WHERE t.id = :tenantId")
    void incrementRequestsToday(@Param("tenantId") Long tenantId);

    //  reset العداد
    @Modifying
    @Query("UPDATE Tenant t SET t.requestsToday = 0, t.lastResetAt = CURRENT_TIMESTAMP WHERE t.id = :tenantId")
    void resetRequestsToday(@Param("tenantId") Long tenantId);
}