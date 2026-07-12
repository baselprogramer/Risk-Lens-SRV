package com.sdn.blacklist.batchscreening.repository;

import com.sdn.blacklist.batchscreening.entity.BatchScreeningResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BatchScreeningResultRepository extends JpaRepository<BatchScreeningResult, Long> {
    List<BatchScreeningResult> findByJobIdOrderByRowNumberAsc(Long jobId);
    long countByJobIdAndMatchTrue(Long jobId);
}