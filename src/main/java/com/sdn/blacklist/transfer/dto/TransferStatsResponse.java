// ══════════════════════════════════════════════════════
// TransferStatsResponse.java  (DTO)
// ══════════════════════════════════════════════════════
package com.sdn.blacklist.transfer.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TransferStatsResponse {
    private long total;
    private long approved;
    private long reviewed;
    private long blocked;
    private long today;
    private double blockRate;   
    private double reviewRate;  
}