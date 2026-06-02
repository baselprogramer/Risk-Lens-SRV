package com.sdn.blacklist.transfer.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
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

    @Column(nullable = false, unique = true, length = 30)
    private String reference;

    // ══════════════════════════════════════════
    //  SENDER
    // ══════════════════════════════════════════
    @Column(nullable = false)
    private String senderName;

    @Column
    private String senderNameAr;

    @Column(length = 10)
    private String senderNationality;

    @Column
    private LocalDate senderDob;

    @Column(length = 30)
    private String senderIdType;

    @Column(length = 100)
    private String senderIdNumber;

    @Column
    private LocalDate senderIdExpiry;

    @Column(length = 255)
    private String senderMotherName;

    @Column(length = 50)
    private String senderPhone;

    @Column(length = 500)
    private String senderAddress;

    @Column(length = 20)
    private String senderResidenceStatus;

    // ══════════════════════════════════════════
    //  RECEIVER
    // ══════════════════════════════════════════
    @Column(nullable = false)
    private String receiverName;

    @Column
    private String receiverNameAr;

    @Column(length = 10)
    private String receiverNationality;

    @Column
    private LocalDate receiverDob;

    @Column(length = 30)
    private String receiverIdType;

    @Column(length = 100)
    private String receiverIdNumber;

    @Column(length = 50)
    private String receiverPhone;

    @Column(length = 255)
    private String receiverBankName;

    @Column(length = 100)
    private String receiverAccountNumber;

    @Column(length = 50)
    private String receiverRelationship;

    // ══════════════════════════════════════════
    //  TRANSFER
    // ══════════════════════════════════════════
    @Column
    private String country;

    @Column(length = 100)
    private String city;

    @Column(precision = 20, scale = 2)
    private BigDecimal amount;

    @Column(length = 10)
    private String currency;

    @Column(precision = 19, scale = 4)
    private BigDecimal amountInUsd;

    @Column(length = 50)
    private String transferPurpose;

    @Column(columnDefinition = "TEXT")
    private String purposeDetails;

    @Column(length = 255)
    private String agentName;

    @Column(length = 20)
    private String commissionType;

    @Column(length = 30)
    private String deliveryMethod;

    // ══════════════════════════════════════════
    //  BRANCH
    // ══════════════════════════════════════════
    @Column(length = 50)
    private String branchId;

    @Column(length = 255)
    private String branchName;

    // ══════════════════════════════════════════
    //  RESULT
    // ══════════════════════════════════════════
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ScreeningAction action;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private RiskLevel riskLevel;

    @Column(nullable = false)
    private Integer riskPoints;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(nullable = false)
    private Long processingMs;

    // ══════════════════════════════════════════
    //  MATCHES
    // ══════════════════════════════════════════
    @OneToMany(mappedBy = "screening", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<TransferScreeningMatch> matches;

    // ══════════════════════════════════════════
    //  AUDIT
    // ══════════════════════════════════════════
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column
    private String createdBy;

    @Column(name = "tenant_id")
    private Long tenantId;

    @Column
    private String operatorId;

    @Column
    private String operatorName;

    @Column(length = 100)
    private String externalReference;

    // ══════════════════════════════════════════
    //  ENUMS
    // ══════════════════════════════════════════
    public enum ScreeningAction { APPROVE, REVIEW, BLOCK }
    public enum RiskLevel       { VERY_LOW, LOW, MEDIUM, HIGH, CRITICAL }
}