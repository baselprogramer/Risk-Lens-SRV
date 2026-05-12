package com.sdn.blacklist.monitoring.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sdn.blacklist.monitoring.entity.MonitoringAlert;

public interface MonitoringAlertRepository extends JpaRepository<MonitoringAlert, Long> {
    List<MonitoringAlert> findByResolvedFalseOrderByCreatedAtDesc();
    List<MonitoringAlert> findAllByOrderByCreatedAtDesc();
    long countByResolvedFalse();
    long countByTypeAndCreatedAtAfter(String type, LocalDateTime after);
    List<MonitoringAlert> findByTenantIdAndResolvedFalse(Long tenantId);

    List<MonitoringAlert> findByTenantIdAndResolvedFalseOrderByCreatedAtDesc(Long tenantId);
    List<MonitoringAlert> findByTenantIdOrderByCreatedAtDesc(Long tenantId);
    
}