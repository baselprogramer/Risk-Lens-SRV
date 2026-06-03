package com.sdn.blacklist.screening.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "screening_match")
public class ScreeningMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String matchedName;
    private String source;
    private Double matchScore;
    private Double weight;
    private Double riskPoints;

    private String sanctionId;

    //  JSON: {"UK":"uuid","OFAC":"uuid"} — id لكل مصدر عشان نجيب التفاصيل
    //    بالـ id المباشر بدل البحث الضبابي (يوقف التكرار والبطء)
    @Column(columnDefinition = "TEXT")
    private String sanctionRefs;

    private boolean pep = false;

    private String notes;
    private String wikidataId;


    @ManyToOne
    @JoinColumn(name = "result_id", nullable = false)
    private ScreeningResult result;

    public Long getId() { return id; }

    public String getMatchedName() { return matchedName; }
    public void setMatchedName(String matchedName) { this.matchedName = matchedName; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public Double getMatchScore() { return matchScore; }
    public void setMatchScore(Double matchScore) { this.matchScore = matchScore; }

    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }

    public Double getRiskPoints() { return riskPoints; }
    public void setRiskPoints(Double riskPoints) { this.riskPoints = riskPoints; }

    public String getSanctionId() { return sanctionId; }
    public void setSanctionId(String sanctionId) { this.sanctionId = sanctionId; }

    // ✅ getter/setter للـ refs
    public String getSanctionRefs()              { return sanctionRefs; }
    public void   setSanctionRefs(String refs)   { this.sanctionRefs = refs; }

    public ScreeningResult getResult() { return result; }
    public void setResult(ScreeningResult result) { this.result = result; }

    public String getNotes()               { return notes;       }
    public void   setNotes(String notes)   { this.notes = notes; }

    public String getWikidataId()                    { return wikidataId;          }
    public void   setWikidataId(String wikidataId)   { this.wikidataId = wikidataId; }

    public boolean isPep()             { return pep;  }
    public void    setPep(boolean pep) { this.pep = pep; }
}