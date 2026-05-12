package com.sdn.blacklist.transfer.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "transfer_screening")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferScreeningRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Reference ──
    @Column(nullable = false, unique = true, length = 30)
    private String reference;           // SCR-2026-00001

    // ── Transfer Data ──
    @Column(nullable = false)
    private String senderName;

    @Column
    private String senderNameAr;

    @Column(nullable = false)
    private String receiverName;

    @Column
    private String receiverNameAr;

    @Column
    private String country;

    @Column(precision = 20, scale = 2)
    private BigDecimal amount;

    @Column(length = 10)
    private String currency;

    // ── Result ──
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ScreeningAction action;     // APPROVE / REVIEW / BLOCK

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private RiskLevel riskLevel;        // VERY_LOW / LOW / MEDIUM / HIGH / CRITICAL

    @Column(nullable = false)
    private Integer riskPoints;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(nullable = false)
    private Long processingMs;

    // ── Matches ──
    @OneToMany(mappedBy = "screening", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<TransferScreeningMatch> matches;

    // ── Audit ──
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column
    private String createdBy;           // username من الـ JWT

    @Column(name = "tenant_id")
    private Long tenantId;

    @Column
    private String operatorId;    // معرف الموظف في البرنامج المالي
    
    @Column
    private String operatorName;  // اسم الموظف

    // ── Enums ──
    public enum ScreeningAction { APPROVE, REVIEW, BLOCK }
    public enum RiskLevel       { VERY_LOW, LOW, MEDIUM, HIGH, CRITICAL }
}