package com.sdn.blacklist.batchscreening.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "batch_screening_jobs")
@Getter
@Setter
public class BatchScreeningJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id")
    private Long tenantId;                 // ملتقط على request thread قبل الـ async

    @Column(name = "file_name")
    private String fileName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BatchStatus status = BatchStatus.PENDING;

    @Column(name = "total_records")
    private int totalRecords;

    @Column(name = "processed_records")
    private int processedRecords;          // لتحديث progress bar عبر الـ polling

    @Column(name = "matched_records")
    private int matchedRecords;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "completed_at")
    private Instant completedAt;

    public enum BatchStatus {
        PENDING, PROCESSING, COMPLETED, FAILED
    }
}