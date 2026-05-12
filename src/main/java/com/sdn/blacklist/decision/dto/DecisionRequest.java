package com.sdn.blacklist.decision.dto;

public class DecisionRequest {

    private String screeningType;  // "PERSON" أو "TRANSFER"
    private Long   screeningId;    // ID الـ result
    private String decision;       // "TRUE_MATCH" | "FALSE_POSITIVE" | "PENDING_REVIEW" | "RISK_ACCEPTED"
    private String comment;        // سبب القرار

    public String getScreeningType() { return screeningType; }
    public void setScreeningType(String screeningType) { this.screeningType = screeningType; }

    public Long getScreeningId() { return screeningId; }
    public void setScreeningId(Long screeningId) { this.screeningId = screeningId; }

    public String getDecision() { return decision; }
    public void setDecision(String decision) { this.decision = decision; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}    

