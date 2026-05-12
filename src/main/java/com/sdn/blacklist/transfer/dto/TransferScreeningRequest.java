// ══════════════════════════════════════════════════════
// TransferScreeningRequest.java  (DTO)
// ══════════════════════════════════════════════════════
package com.sdn.blacklist.transfer.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TransferScreeningRequest {

    @NotBlank(message = "Sender name is required")
    private String senderName;

    private String senderNameAr;

    @NotBlank(message = "Receiver name is required")
    private String receiverName;

    private String receiverNameAr;

    private String country;

    private BigDecimal amount;

    private String currency;

    private String operatorId;    // معرف الموظف في البرنامج (اختياري)
    private String operatorName;  // اسم الموظف (اختياري)

    private String createdBy;     // username من JWT أو API Key

}





