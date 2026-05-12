package com.sdn.blacklist.screening.dto;

import com.sdn.blacklist.screening.model.ScreeningMatch;

public class ScreeningMatchDto {

    private String  matchedName;
    private String  source;
    private Double  matchScore;
    private Double  riskPoints;
    private String  sanctionId;
    private boolean isPep;       
    private String  notes;       
    private String  wikidataId;  

    public ScreeningMatchDto(ScreeningMatch m) {
        this.matchedName = m.getMatchedName();
        this.source      = m.getSource();
        this.matchScore  = m.getMatchScore();
        this.riskPoints  = m.getRiskPoints();
        this.sanctionId  = m.getSanctionId();
        this.isPep       = "PEP".equalsIgnoreCase(m.getSource()); 
        this.notes       = m.getNotes();      
        this.wikidataId  = m.getWikidataId();  
    }

    public String  getMatchedName() { return matchedName; }
    public String  getSource()      { return source;      }
    public Double  getMatchScore()  { return matchScore;  }
    public Double  getRiskPoints()  { return riskPoints;  }
    public String  getSanctionId()  { return sanctionId;  }
    public boolean isPep()          { return isPep;       }
    public String  getNotes()       { return notes;       }
    public String  getWikidataId()  { return wikidataId;  }
}