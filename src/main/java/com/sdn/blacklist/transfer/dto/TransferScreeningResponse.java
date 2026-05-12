// ══════════════════════════════════════════════════════
// TransferScreeningResponse.java  (DTO)
// ══════════════════════════════════════════════════════
package com.sdn.blacklist.transfer.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.sdn.blacklist.transfer.entity.TransferScreeningRecord.RiskLevel;
import com.sdn.blacklist.transfer.entity.TransferScreeningRecord.ScreeningAction;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TransferScreeningResponse {

    private Long        id;
    private String      reference;

    // Transfer
    private String      senderName;
    private String      receiverName;
    private String      country;
    private BigDecimal  amount;
    private String      currency;

    // Result
    private ScreeningAction action;
    private RiskLevel       riskLevel;
    private Integer         riskPoints;
    private String          reason;
    private Long            processingMs;

    // Matches
    private List<MatchDTO> matches;

    private LocalDateTime createdAt;
    private String        createdBy;

    private String operatorId;
    private String operatorName;

    @Data
    @Builder
    public static class MatchDTO {
        private String party;       // SENDER / RECEIVER
        private String matchedName;
        private String source;
        private Double score;
        private String entityType;
        private String country;
        private String sanctionId;

        
    }
}
