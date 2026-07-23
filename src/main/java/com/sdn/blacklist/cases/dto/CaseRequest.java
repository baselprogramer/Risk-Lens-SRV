package com.sdn.blacklist.cases.dto;

import java.time.LocalDateTime;

// REQUEST — إنشاء أو تعديل Case
public class CaseRequest {
    private String caseType;
    private Long screeningId;
    private String subjectName;
    private String priority;
    private String assignedTo;
    private Long branchId;
    private String notes;
    private String suspicionReason;
    private LocalDateTime dueDate;

    //  حظر سياسة البنك
    private boolean blocked;
    private String  blockMessage;
    private Long    blockRuleId;

    public String getCaseType() {
        return caseType;
    }

    public void setCaseType(String v) {
        this.caseType = v;
    }

    public Long getScreeningId() {
        return screeningId;
    }

    public void setScreeningId(Long v) {
        this.screeningId = v;
    }

    public String getSubjectName() {
        return subjectName;
    }

    public void setSubjectName(String v) {
        this.subjectName = v;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String v) {
        this.priority = v;
    }

    public String getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(String v) {
        this.assignedTo = v;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String v) {
        this.notes = v;
    }

    public LocalDateTime getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDateTime v) {
        this.dueDate = v;
    }

    public String getSuspicionReason() { return suspicionReason; }
    public void setSuspicionReason(String v) { this.suspicionReason = v; }

    //  حظر سياسة البنك
    public boolean isBlocked() { return blocked; }
    public void setBlocked(boolean v) { this.blocked = v; }

    public String getBlockMessage() { return blockMessage; }
    public void setBlockMessage(String v) { this.blockMessage = v; }

    public Long getBlockRuleId() { return blockRuleId; }
    public void setBlockRuleId(Long v) { this.blockRuleId = v; }

    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
}