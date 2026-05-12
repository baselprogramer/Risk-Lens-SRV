package com.sdn.blacklist.decision.dto;

import java.time.LocalDateTime;

public class DecisionResponse {
 
    private Long          id;
    private String        screeningType;
    private Long          screeningId;
    private String        decision;
    private String        comment;
    private String        decidedBy;
    private LocalDateTime decidedAt;
    private String        subjectName;   //  اسم الشخص أو "Sender → Receiver"
 
    public DecisionResponse(Long id, String screeningType, Long screeningId,
                            String decision, String comment,
                            String decidedBy, LocalDateTime decidedAt,
                            String subjectName) {
        this.id            = id;
        this.screeningType = screeningType;
        this.screeningId   = screeningId;
        this.decision      = decision;
        this.comment       = comment;
        this.decidedBy     = decidedBy;
        this.decidedAt     = decidedAt;
        this.subjectName   = subjectName;
    }
 
    public Long getId()                  { return id; }
    public String getScreeningType()     { return screeningType; }
    public Long getScreeningId()         { return screeningId; }
    public String getDecision()          { return decision; }
    public String getComment()           { return comment; }
    public String getDecidedBy()         { return decidedBy; }
    public LocalDateTime getDecidedAt()  { return decidedAt; }
    public String getSubjectName()       { return subjectName; }
}