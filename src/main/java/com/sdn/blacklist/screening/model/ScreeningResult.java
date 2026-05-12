package com.sdn.blacklist.screening.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;

@Entity
public class ScreeningResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToMany(mappedBy = "result",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY)
    private List<ScreeningMatch> matches = new ArrayList<>();

    @OneToOne
    @JoinColumn(name = "request_id", nullable = false)
    private ScreeningRequest request;

    @Enumerated(EnumType.STRING)
    private ScreeningStatus status;

    @Enumerated(EnumType.STRING)
    private RiskLevel riskLevel;

    private String notes;
    private LocalDateTime createdAt;

    @Column(name = "tenant_id")  
    private Long tenantId;

    // ===== getters setters =====

    public Long getId() { return id; }

    public List<ScreeningMatch> getMatches() { return matches; }

    public void addMatch(ScreeningMatch match) {
        matches.add(match);
        match.setResult(this);
    }

    public ScreeningRequest getRequest() { return request; }
    public void setRequest(ScreeningRequest request) { this.request = request; }

    public ScreeningStatus getStatus() { return status; }
    public void setStatus(ScreeningStatus status) { this.status = status; }

    public RiskLevel getRiskLevel() { return riskLevel; }
    public void setRiskLevel(RiskLevel riskLevel) { this.riskLevel = riskLevel; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Long getTenantId() { return tenantId; }          
    public void setTenantId(Long tenantId) { this.tenantId = tenantId; } 
}