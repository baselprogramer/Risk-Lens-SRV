package com.sdn.blacklist.common.dto;

import java.time.LocalDate;
import java.util.UUID;

public class SanctionSearchResult {

    private UUID id;
    private String name;
    private Double score;
    private String source;
    private Double nameSimilarity;
    private Double aliasSimilarity;
    private String notes;
    private String wikidataId;

    private String nationalityConfidence = "UNAVAILABLE";

    private String dobConfidence = "UNAVAILABLE";

    private String idConfidence = "UNAVAILABLE";

    private double confirmingBoost = 0.0;

    private String confidenceLevel = "UNCONFIRMED";

    // Constructors

    public SanctionSearchResult(UUID id, String name, Double score,
            String source, Double nameSimilarity,
            Double aliasSimilarity) {
        this.id = id;
        this.name = name;
        this.score = score;
        this.source = source;
        this.nameSimilarity = nameSimilarity;
        this.aliasSimilarity = aliasSimilarity;
    }

    public void applyConfirmingFactors(ConfirmingData input, SanctionRecordData sanctionData) {
        double boost = 0.0;

        // ── رقم الوثيقة — أقوى دليل ──
        if (input.idNumber != null && !input.idNumber.isBlank()
                && sanctionData.idNumber != null && !sanctionData.idNumber.isBlank()) {
            // normalize: lowercase، بدون مسافات ودواشات
            String inputId = normalizeId(input.idNumber);
            String sanctionId = normalizeId(sanctionData.idNumber);
            if (inputId.equals(sanctionId)) {
                boost += 25.0;
                idConfidence = "CONFIRMED";
            } else {
                idConfidence = "NO_MATCH";
                boost -= 5.0;
            }
        }

        // ── تاريخ الميلاد ──
        if (input.dob != null && sanctionData.dob != null) {
            if (input.dob.equals(sanctionData.dob)) {
                boost += 15.0;
                dobConfidence = "EXACT_MATCH";
            } else if (input.dob.getYear() == sanctionData.dob.getYear()) {
                boost += 8.0;
                dobConfidence = "YEAR_MATCH";
            } else {
                dobConfidence = "NO_MATCH";
                boost -= 3.0;
            }
        }

        // ── الجنسية ──
        if (input.nationality != null && !input.nationality.isBlank()
                && sanctionData.nationality != null && !sanctionData.nationality.isBlank()) {
            if (input.nationality.equalsIgnoreCase(sanctionData.nationality)) {
                boost += 10.0;
                nationalityConfidence = "MATCH";
            } else {
                nationalityConfidence = "NO_MATCH";
                boost -= 2.0;
            }
        }

        // ── تطبيق الـ boost ──
        confirmingBoost = boost;
        double newScore = Math.min(Math.max(score + boost, 0.0), 100.0);
        score = newScore;
        nameSimilarity = Math.min(Math.max(nameSimilarity + boost * 0.5, 0.0), 100.0);

        // ── تحديد مستوى الثقة ──
        if ("CONFIRMED".equals(idConfidence)) {
            confidenceLevel = "CONFIRMED";
        } else if ("EXACT_MATCH".equals(dobConfidence) && boost >= 20) {
            confidenceLevel = "CONFIRMED";
        } else if (boost >= 15) {
            confidenceLevel = "PROBABLE";
        } else if (boost >= 8) {
            confidenceLevel = "POSSIBLE";
        } else {
            confidenceLevel = "UNCONFIRMED";
        }
    }

    private String normalizeId(String id) {
        return id.toLowerCase()
                .replaceAll("[\\s\\-_]", "")
                .trim();
    }

    // ConfirmingData — بيانات العميل المُدخلة
    public static class ConfirmingData {
        public final String nationality;
        public final LocalDate dob;
        public final String idNumber;
        public final String idType;

        public ConfirmingData(String nationality, LocalDate dob,
                String idNumber, String idType) {
            this.nationality = nationality;
            this.dob = dob;
            this.idNumber = idNumber;
            this.idType = idType;
        }

        // factory من ScreeningRequest
        public static ConfirmingData fromRequest(
                String nationality, LocalDate dob, String idNumber, String idType) {
            return new ConfirmingData(nationality, dob, idNumber, idType);
        }

        public boolean isEmpty() {
            return (nationality == null || nationality.isBlank())
                    && dob == null
                    && (idNumber == null || idNumber.isBlank());
        }
    }

    // SanctionRecordData — بيانات من قائمة العقوبات
    public static class SanctionRecordData {
        public final String nationality;
        public final LocalDate dob;
        public final String idNumber;

        public SanctionRecordData(String nationality, LocalDate dob, String idNumber) {
            this.nationality = nationality;
            this.dob = dob;
            this.idNumber = idNumber;
        }

        // فارغ — لو القائمة ما عندها بيانات إضافية
        public static SanctionRecordData empty() {
            return new SanctionRecordData(null, null, null);
        }
    }

    // ══════════════════════════════════════════
    // Builder
    // ══════════════════════════════════════════
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID id;
        private String name;
        private Double score = 0.0;
        private String source = "PEP";
        private Double nameSimilarity = 0.0;
        private Double aliasSimilarity = 0.0;
        private String notes;
        private String wikidataId;

        public Builder id(UUID id) {
            this.id = id;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder score(Double score) {
            this.score = score;
            return this;
        }

        public Builder source(String source) {
            this.source = source;
            return this;
        }

        public Builder nameSimilarity(Double v) {
            this.nameSimilarity = v;
            return this;
        }

        public Builder aliasSimilarity(Double v) {
            this.aliasSimilarity = v;
            return this;
        }

        public Builder notes(String notes) {
            this.notes = notes;
            return this;
        }

        public Builder wikidataId(String wikidataId) {
            this.wikidataId = wikidataId;
            return this;
        }

        public SanctionSearchResult build() {
            SanctionSearchResult r = new SanctionSearchResult(
                    id != null ? id : UUID.randomUUID(),
                    name, score, source, nameSimilarity, aliasSimilarity);
            r.notes = this.notes;
            r.wikidataId = this.wikidataId;
            return r;
        }
    }

    // ══════════════════════════════════════════
    // Getters
    // ══════════════════════════════════════════
    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Double getScore() {
        return score;
    }

    public String getSource() {
        return source;
    }

    public Double getNameSimilarity() {
        return nameSimilarity;
    }

    public Double getAliasSimilarity() {
        return aliasSimilarity;
    }

    public String getNotes() {
        return notes;
    }

    public String getWikidataId() {
        return wikidataId;
    }

    public String getNationalityConfidence() {
        return nationalityConfidence;
    }

    public String getDobConfidence() {
        return dobConfidence;
    }

    public String getIdConfidence() {
        return idConfidence;
    }

    public double getConfirmingBoost() {
        return confirmingBoost;
    }

    public String getConfidenceLevel() {
        return confidenceLevel;
    }
}