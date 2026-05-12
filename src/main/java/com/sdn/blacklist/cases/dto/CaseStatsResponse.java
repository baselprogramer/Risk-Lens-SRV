package com.sdn.blacklist.cases.dto;

// ══════════════════════════════════════════
// STATS RESPONSE
// ══════════════════════════════════════════
public class CaseStatsResponse {
    private long total;
    private long open;
    private long inReview;
    private long escalated;
    private long closed;
    private long critical;
    private long overdue;

    public CaseStatsResponse(long total, long open, long inReview,
                              long escalated, long closed, long critical, long overdue) {
        this.total     = total;
        this.open      = open;
        this.inReview  = inReview;
        this.escalated = escalated;
        this.closed    = closed;
        this.critical  = critical;
        this.overdue   = overdue;
    }

    public long getTotal()     { return total;     }
    public long getOpen()      { return open;      }
    public long getInReview()  { return inReview;  }
    public long getEscalated() { return escalated; }
    public long getClosed()    { return closed;    }
    public long getCritical()  { return critical;  }
    public long getOverdue()   { return overdue;   }
}

 class CaseStatusRequest {
    private String status;
    private String resolution;

    public String getStatus()     { return status;     }
    public void   setStatus(String v) { this.status = v; }
    public String getResolution() { return resolution; }
    public void   setResolution(String v) { this.resolution = v; }
}