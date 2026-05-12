package com.sdn.blacklist.common.dto;

import java.util.UUID;

public class SanctionSearchResult {

    private UUID   id;
    private String name;
    private Double score;
    private String source;
    private Double nameSimilarity;
    private Double aliasSimilarity;
    private String notes;      
    private String wikidataId;  

    // ── Constructor الأصلي (للـ ES results) ──
    public SanctionSearchResult(UUID id, String name, Double score,
                                String source, Double nameSimilarity,
                                Double aliasSimilarity) {
        this.id              = id;
        this.name            = name;
        this.score           = score;
        this.source          = source;
        this.nameSimilarity  = nameSimilarity;
        this.aliasSimilarity = aliasSimilarity;
    }

    // ── Builder للـ PEP results ──
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private UUID   id;
        private String name;
        private Double score           = 0.0;
        private String source          = "PEP";
        private Double nameSimilarity  = 0.0;
        private Double aliasSimilarity = 0.0;
        private String notes;
        private String wikidataId;

        public Builder id(UUID id)                       { this.id              = id;              return this; }
        public Builder name(String name)                 { this.name            = name;            return this; }
        public Builder score(Double score)               { this.score           = score;           return this; }
        public Builder source(String source)             { this.source          = source;          return this; }
        public Builder nameSimilarity(Double v)          { this.nameSimilarity  = v;               return this; }
        public Builder aliasSimilarity(Double v)         { this.aliasSimilarity = v;               return this; }
        public Builder notes(String notes)               { this.notes           = notes;           return this; }
        public Builder wikidataId(String wikidataId)     { this.wikidataId      = wikidataId;      return this; }

        public SanctionSearchResult build() {
            SanctionSearchResult r = new SanctionSearchResult(
                id != null ? id : UUID.randomUUID(),
                name, score, source, nameSimilarity, aliasSimilarity
            );
            r.notes      = this.notes;
            r.wikidataId = this.wikidataId;
            return r;
        }
    }

    // ── Getters ──
    public UUID   getId()              { return id;              }
    public String getName()            { return name;            }
    public Double getScore()           { return score;           }
    public String getSource()          { return source;          }
    public Double getNameSimilarity()  { return nameSimilarity;  }
    public Double getAliasSimilarity() { return aliasSimilarity; }
    public String getNotes()           { return notes;           }
    public String getWikidataId()      { return wikidataId;      }
}