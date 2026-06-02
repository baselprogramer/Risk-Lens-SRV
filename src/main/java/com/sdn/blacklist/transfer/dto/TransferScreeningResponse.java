package com.sdn.blacklist.transfer.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.sdn.blacklist.transfer.entity.TransferScreeningRecord.RiskLevel;
import com.sdn.blacklist.transfer.entity.TransferScreeningRecord.ScreeningAction;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TransferScreeningResponse {

    private Long      id;
    private String    reference;

    // ══════════════════════════════════════════
    //  SENDER
    // ══════════════════════════════════════════
    private String    senderName;
    private String    senderNameAr;
    private String    senderNationality;
    private LocalDate senderDob;
    private String    senderIdType;
    private String    senderIdNumber;
    private String    senderPhone;
    private String    senderResidenceStatus;

    // ══════════════════════════════════════════
    //  RECEIVER
    // ══════════════════════════════════════════
    private String    receiverName;
    private String    receiverNameAr;
    private String    receiverNationality;
    private String    receiverBankName;
    private String    receiverAccountNumber;
    private String    receiverRelationship;

    // ══════════════════════════════════════════
    //  TRANSFER
    // ══════════════════════════════════════════
    private String     country;
    private String     city;
    private BigDecimal amount;
    private String     currency;
    private BigDecimal amountInUsd;
    private String     transferPurpose;
    private String     agentName;
    private String     deliveryMethod;

    // ══════════════════════════════════════════
    //  BRANCH / OPERATOR
    // ══════════════════════════════════════════
    private String branchId;
    private String branchName;
    private String operatorId;
    private String operatorName;
    private String externalReference;

    // ══════════════════════════════════════════
    //  RESULT
    // ══════════════════════════════════════════
    private ScreeningAction action;
    private RiskLevel       riskLevel;
    private Integer         riskPoints;
    private String          reason;
    private Long            processingMs;

    // ══════════════════════════════════════════
    //  MATCHES
    // ══════════════════════════════════════════
    private List<MatchDTO> matches;

    // ══════════════════════════════════════════
    //  AUDIT
    // ══════════════════════════════════════════
    private LocalDateTime createdAt;
    private String        createdBy;

    // ══════════════════════════════════════════
    //  MatchDTO
    // ══════════════════════════════════════════
    @Data
    @Builder
    public static class MatchDTO {
        private String party;           // SENDER / RECEIVER
        private String matchedName;
        private String source;          // OFAC / UN / EU / INTERPOL / PEP / FATF / THRESHOLD
        private Double score;
        private String entityType;
        private String country;
        private String sanctionId;
        private String confidenceLevel; // CONFIRMED / PROBABLE / POSSIBLE / UNCONFIRMED
    }
}