package com.sdn.blacklist.cases.dto;

import java.time.LocalDateTime;

 
// ══════════════════════════════════════════
// RESPONSE
// ══════════════════════════════════════════
 public class CaseResponse {
    private Long          id;
    private String        caseType;
    private Long          screeningId;
    private String        subjectName;
    private String        reference;
    private String        status;
    private String        priority;
    private String        assignedTo;
    private String        createdBy;
    private String        notes;
    private String        resolution;
    private String        riskLevel;
    private Integer       matchCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime closedAt;
    private LocalDateTime dueDate;

    // Getters
    public Long          getId()          { return id;          }
    public String        getCaseType()    { return caseType;    }
    public Long          getScreeningId() { return screeningId; }
    public String        getSubjectName() { return subjectName; }
    public String        getReference()   { return reference;   }
    public String        getStatus()      { return status;      }
    public String        getPriority()    { return priority;    }
    public String        getAssignedTo()  { return assignedTo;  }
    public String        getCreatedBy()   { return createdBy;   }
    public String        getNotes()       { return notes;       }
    public String        getResolution()  { return resolution;  }
    public String        getRiskLevel()   { return riskLevel;   }
    public Integer       getMatchCount()  { return matchCount;  }
    public LocalDateTime getCreatedAt()   { return createdAt;   }
    public LocalDateTime getUpdatedAt()   { return updatedAt;   }
    public LocalDateTime getClosedAt()    { return closedAt;    }
    public LocalDateTime getDueDate()     { return dueDate;     }

    // Setters
    public void setId(Long v)                  { this.id = v;          }
    public void setCaseType(String v)          { this.caseType = v;    }
    public void setScreeningId(Long v)         { this.screeningId = v; }
    public void setSubjectName(String v)       { this.subjectName = v; }
    public void setReference(String v)         { this.reference = v;   }
    public void setStatus(String v)            { this.status = v;      }
    public void setPriority(String v)          { this.priority = v;    }
    public void setAssignedTo(String v)        { this.assignedTo = v;  }
    public void setCreatedBy(String v)         { this.createdBy = v;   }
    public void setNotes(String v)             { this.notes = v;       }
    public void setResolution(String v)        { this.resolution = v;  }
    public void setRiskLevel(String v)         { this.riskLevel = v;   }
    public void setMatchCount(Integer v)       { this.matchCount = v;  }
    public void setCreatedAt(LocalDateTime v)  { this.createdAt = v;   }
    public void setUpdatedAt(LocalDateTime v)  { this.updatedAt = v;   }
    public void setClosedAt(LocalDateTime v)   { this.closedAt = v;    }
    public void setDueDate(LocalDateTime v)    { this.dueDate = v;     }
}
