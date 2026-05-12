package com.sdn.blacklist.webhook.entity;

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
@Table(name = "webhook_configs")
public class WebhookConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long tenantId;

    @Column(nullable = false)
    private String url;

    // الأحداث: SCREENING_HIGH, SCREENING_CRITICAL, DECISION_CHANGED, TRANSFER_HIGH
    @Column(nullable = false)
    private String events;

    @Column(nullable = false)
    private boolean active = true;

    // Secret لتوقيع الـ payload
    private String secret;

    private LocalDateTime createdAt;
    private LocalDateTime lastTriggeredAt;

    @Column(nullable = false)
    private int failureCount = 0;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}