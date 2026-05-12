package com.sdn.blacklist.screening.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.sdn.blacklist.user.entity.User;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;

@Entity
public class ScreeningRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;
    private String country;

    @Enumerated(EnumType.STRING)
    private ScreeningStatus status;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @OneToOne(mappedBy = "request", cascade = CascadeType.ALL)
    @JsonManagedReference
    private ScreeningResult result;

    @Column(name = "tenant_id")  
    private Long tenantId;

    // =======================
    // Constructors
    // =======================
    public ScreeningRequest() {}

    public ScreeningRequest(String fullName, String country) {
        this.fullName  = fullName;
        this.country   = country;
        this.status    = ScreeningStatus.PENDING;
        this.createdAt = LocalDateTime.now();
    }

    // =======================
    // Getters & Setters
    // =======================
    public Long getId()                         { return id; }
    public void setId(Long id)                  { this.id = id; }

    public String getFullName()                 { return fullName; }
    public void setFullName(String fullName)    { this.fullName = fullName; }

    public String getCountry()                  { return country; }
    public void setCountry(String country)      { this.country = country; }

    public ScreeningStatus getStatus()          { return status; }
    public void setStatus(ScreeningStatus s)    { this.status = s; }

    public LocalDateTime getCreatedAt()         { return createdAt; }
    public void setCreatedAt(LocalDateTime t)   { this.createdAt = t; }

    public User getCreatedBy()                  { return createdBy; }
    public void setCreatedBy(User u)            { this.createdBy = u; }

    public ScreeningResult getResult()          { return result; }
    public void setResult(ScreeningResult r)    { this.result = r; }

    public Long getTenantId()                   { return tenantId; }       
    public void setTenantId(Long tenantId)      { this.tenantId = tenantId; } 
}