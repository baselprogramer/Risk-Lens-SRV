package com.sdn.blacklist.riskconfig.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * إعدادات محرّك المخاطر لكل شركة (tenant). one-to-one مع الـ tenant.
 *
 * المرحلة 1: similarity_threshold فقط.
 * المرحلة 2 (لاحقاً): أعمدة عتبات الخطورة (screening/transfer cutoffs) عبر ALTER.
 * المرحلة 3 (لاحقاً): الأثقال per-source.
 *
 * ملاحظة: ddl-auto=none — الجدول يُنشأ يدوياً في pgAdmin، وهاي الـ entity بس بتعمل mapping.
 */
@Entity
@Table(name = "tenant_risk_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantRiskConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, unique = true)
    private Long tenantId;

    /** عتبة التشابه للفحص. أدنى 50، أعلى 100 — مفروضة كـ CHECK على مستوى الـ DB. */
    @Column(name = "similarity_threshold", nullable = false)
    private Double similarityThreshold;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}