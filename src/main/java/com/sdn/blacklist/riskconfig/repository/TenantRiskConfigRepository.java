package com.sdn.blacklist.riskconfig.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sdn.blacklist.riskconfig.entity.TenantRiskConfig;

@Repository
public interface TenantRiskConfigRepository extends JpaRepository<TenantRiskConfig, Long> {

    // one-to-one مع الشركة — العتبة تُقرأ عبر هاد على thread الطلب
    Optional<TenantRiskConfig> findByTenantId(Long tenantId);
}