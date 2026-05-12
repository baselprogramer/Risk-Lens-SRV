package com.sdn.blacklist.apikey.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "api_keys")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String keyHash;          // SHA-256

    @Column(nullable = false)
    private String keyPrefix;        // ak_live_XXXXXXXX للعرض

    @Column(nullable = false)
    private String name;             // اسم الشركة

    private String description;

    // ── ربط بالمشترك ──
    @Column(nullable = false)
    private String username;         // اسم المشترك المرتبط

    @Column(nullable = false)
    private String createdBy;        // ADMIN اللي أنشأه

    @Column(nullable = false)
    private boolean active;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime expiresAt; // تاريخ انتهاء الاشتراك — مطلوب دائماً

    @Column(name = "tenant_id")
    private Long tenantId;

    private LocalDateTime lastUsedAt;

    private Long requestCount;

    private String allowedIps;
}