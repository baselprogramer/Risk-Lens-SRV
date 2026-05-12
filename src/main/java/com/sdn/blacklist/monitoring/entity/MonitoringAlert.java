package com.sdn.blacklist.monitoring.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "monitoring_alerts")
public class MonitoringAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // RATE_LIMIT | ES_DOWN | IMPORT_FAILED | CRITICAL_SPIKE
    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String severity; // WARNING | CRITICAL

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    private Long tenantId;
    private String source; // OFAC, UN, ES, SYSTEM

    private boolean resolved = false;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}