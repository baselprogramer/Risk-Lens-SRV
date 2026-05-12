package com.sdn.blacklist.cases.dto;


// ══════════════════════════════════════════
// REQUEST — إنشاء أو تعديل Case
// ══════════════════════════════════════════
public class CaseRequest {
    private String      caseType;
    private Long        screeningId;
    private String      subjectName;
    private String      priority;
    private String      assignedTo;
    private String      notes;
    private String      dueDate;

    public String  getCaseType()    { return caseType;    }
    public void    setCaseType(String v)    { this.caseType = v;    }
    public Long    getScreeningId() { return screeningId; }
    public void    setScreeningId(Long v)   { this.screeningId = v; }
    public String  getSubjectName() { return subjectName; }
    public void    setSubjectName(String v) { this.subjectName = v; }
    public String  getPriority()    { return priority;    }
    public void    setPriority(String v)    { this.priority = v;    }
    public String  getAssignedTo()  { return assignedTo;  }
    public void    setAssignedTo(String v)  { this.assignedTo = v;  }
    public String  getNotes()       { return notes;       }
    public void    setNotes(String v)       { this.notes = v;       }
    public String  getDueDate()     { return dueDate;     }
    public void    setDueDate(String v)     { this.dueDate = v;     }
}




