package com.sdn.blacklist.batchscreening.repository;

import com.sdn.blacklist.batchscreening.entity.BatchScreeningJob;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BatchScreeningJobRepository extends JpaRepository<BatchScreeningJob, Long> {
    List<BatchScreeningJob> findByTenantIdOrderByCreatedAtDesc(Long tenantId);
    List<BatchScreeningJob> findAllByOrderByCreatedAtDesc();   // fallback للسوبر أدمن (tenant null)
}