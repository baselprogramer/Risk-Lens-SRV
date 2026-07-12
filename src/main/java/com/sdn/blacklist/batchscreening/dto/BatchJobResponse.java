package com.sdn.blacklist.batchscreening.dto;

import java.time.Instant;

import com.sdn.blacklist.batchscreening.entity.BatchScreeningJob;

import lombok.Getter;

/**
 * Response خفيف للـ frontend (رفع + polling).
 * بيخفي حقول الـ entity الداخلية وبيحسب progress% بمكان واحد.
 */
@Getter
public class BatchJobResponse {

    private final Long    jobId;
    private final String  fileName;
    private final String  status;          // PENDING / PROCESSING / COMPLETED / FAILED
    private final int     totalRecords;
    private final int     processedRecords;
    private final int     matchedRecords;
    private final int     progressPercent; // 0..100 — محسوب هون
    private final String  errorMessage;
    private final String  createdBy;
    private final Instant createdAt;
    private final Instant completedAt;

    private BatchJobResponse(BatchScreeningJob j) {
        this.jobId            = j.getId();
        this.fileName         = j.getFileName();
        this.status           = j.getStatus() != null ? j.getStatus().name() : null;
        this.totalRecords     = j.getTotalRecords();
        this.processedRecords = j.getProcessedRecords();
        this.matchedRecords   = j.getMatchedRecords();
        this.progressPercent  = j.getTotalRecords() > 0
            ? (int) Math.floor(100.0 * j.getProcessedRecords() / j.getTotalRecords())
            : 0;
        this.errorMessage     = j.getErrorMessage();
        this.createdBy        = j.getCreatedBy();
        this.createdAt        = j.getCreatedAt();
        this.completedAt      = j.getCompletedAt();
    }

    public static BatchJobResponse from(BatchScreeningJob j) {
        return new BatchJobResponse(j);
    }
}