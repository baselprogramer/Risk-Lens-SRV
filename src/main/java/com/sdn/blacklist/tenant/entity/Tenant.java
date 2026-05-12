package com.sdn.blacklist.tenant.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tenants")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String code;

    private String email;
    private String phone;
    private String country;

    @Column(nullable = false)
    private boolean active;

    @Enumerated(EnumType.STRING)
    private TenantPlan plan;        // BASIC | PRO | ENTERPRISE

    //  حد الطلبات اليومي — يتحدد تلقائياً حسب الـ plan
    @Column(nullable = false)
    @Builder.Default
    private int dailyLimit = 500;   // default BASIC

    //  عداد الطلبات اليوم
    @Column(nullable = false)
    @Builder.Default
    private int requestsToday = 0;

    // تاريخ آخر reset للعداد
    private LocalDateTime lastResetAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime expiresAt;
    private String notes;
}