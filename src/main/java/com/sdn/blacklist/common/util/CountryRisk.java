package com.sdn.blacklist.common.util;


import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "country_risk")
public class CountryRisk {

    @Id
    @Column(name = "country_code", length = 3)
    private String countryCode;

    @Column(name = "country_name", nullable = false)
    private String countryName;

    @Column(name = "risk_tier", nullable = false)
    private String riskTier;

    @Column(name = "risk_score", nullable = false)
    private double riskScore;

    @Column(name = "fatf_status")
    private String fatfStatus;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    // Getters & Setters
    public String getCountryCode()                       { return countryCode; }
    public void setCountryCode(String countryCode)       { this.countryCode = countryCode; }

    public String getCountryName()                       { return countryName; }
    public void setCountryName(String countryName)       { this.countryName = countryName; }

    public String getRiskTier()                          { return riskTier; }
    public void setRiskTier(String riskTier)             { this.riskTier = riskTier; }

    public double getRiskScore()                         { return riskScore; }
    public void setRiskScore(double riskScore)           { this.riskScore = riskScore; }

    public String getFatfStatus()                        { return fatfStatus; }
    public void setFatfStatus(String fatfStatus)         { this.fatfStatus = fatfStatus; }

    public LocalDateTime getLastUpdated()                { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated){ this.lastUpdated = lastUpdated; }
}
