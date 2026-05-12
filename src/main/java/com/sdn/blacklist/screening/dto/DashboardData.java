package com.sdn.blacklist.screening.dto;

public class DashboardData {
    private long totalSearches;
    private long positiveMatches;
    private long highRisk;
    private long mediumRisk;
    private long lowRisk;

    // Getters & Setters
    public long getTotalSearches() { return totalSearches; }
    public void setTotalSearches(long totalSearches) { this.totalSearches = totalSearches; }

    public long getPositiveMatches() { return positiveMatches; }
    public void setPositiveMatches(long positiveMatches) { this.positiveMatches = positiveMatches; }

    public long getHighRisk() { return highRisk; }
    public void setHighRisk(long highRisk) { this.highRisk = highRisk; }

    public long getMediumRisk() { return mediumRisk; }
    public void setMediumRisk(long mediumRisk) { this.mediumRisk = mediumRisk; }

    public long getLowRisk() { return lowRisk; }
    public void setLowRisk(long lowRisk) { this.lowRisk = lowRisk; }
}