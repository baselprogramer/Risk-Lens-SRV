package com.sdn.blacklist.decision.entity;

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
@Table(name = "decisions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Decision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── ربط بالنتيجة — Screening أو Transfer ──
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ScreeningType screeningType;   // PERSON / TRANSFER

    @Column(nullable = false)
    private Long screeningId;              // ID الـ ScreeningResult أو TransferScreeningRecord

    // ── القرار ──
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DecisionType decision;

    @Column(columnDefinition = "TEXT")
    private String comment;               // سبب القرار

    // ── Audit ──
    @Column(nullable = false)
    private String decidedBy;             // username

    @Column(nullable = false)
    private LocalDateTime decidedAt;

    @Column(name = "tenant_id")
    private Long tenantId;

    // ── Enums ──
    public enum ScreeningType {
        PERSON,    // ScreeningResult
        TRANSFER   // TransferScreeningRecord
    }

    public enum DecisionType {
        TRUE_MATCH,       // مطابقة حقيقية — إيقاف
        FALSE_POSITIVE,   // مطابقة خاطئة — تخليص
        PENDING_REVIEW,   // قيد المراجعة
        RISK_ACCEPTED     // خطر معروف ومقبول
    }
}