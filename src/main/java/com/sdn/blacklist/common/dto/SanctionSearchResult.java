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
    private String dobConfidence         = "UNAVAILABLE";
    private String idConfidence          = "UNAVAILABLE";
    private String motherNameConfidence  = "UNAVAILABLE";
    private double confirmingBoost       = 0.0;
    private String confidenceLevel       = "UNCONFIRMED";

    public SanctionSearchResult(UUID id, String name, Double score,
            String source, Double nameSimilarity, Double aliasSimilarity) {
        this.id              = id;
        this.name            = name;
        this.score           = score;
        this.source          = source;
        this.nameSimilarity  = nameSimilarity;
        this.aliasSimilarity = aliasSimilarity;
    }

    public void applyConfirmingFactors(ConfirmingData input, SanctionRecordData sanctionData) {
        double boost   = 0.0;
        double penalty = 0.0;
        boolean isLocal = "LOCAL".equalsIgnoreCase(source);

        if (notBlank(input.idNumber) && notBlank(sanctionData.idNumber)) {
            String inId  = normalizeId(input.idNumber);
            String sanId = normalizeId(sanctionData.idNumber);
            if (inId.equals(sanId)) {
                boost += isLocal ? 30.0 : 25.0;
                idConfidence = "CONFIRMED";
            } else {
                penalty -= isLocal ? 20.0 : 10.0;
                idConfidence = "NO_MATCH";
            }
        }

        if (isLocal && notBlank(input.motherName) && notBlank(sanctionData.motherName)) {
            double mSim = simpleNameSim(
                    normalize(input.motherName),
                    normalize(sanctionData.motherName));
            if (mSim >= 90.0) {
                boost += 20.0;
                motherNameConfidence = "CONFIRMED";
            } else if (mSim >= 70.0) {
                boost += 10.0;
                motherNameConfidence = "PARTIAL";
            } else {
                penalty -= 10.0;
                motherNameConfidence = "NO_MATCH";
            }
        }

        if (input.dob != null && sanctionData.dob != null) {
            if (input.dob.equals(sanctionData.dob)) {
                boost += 15.0;
                dobConfidence = "EXACT_MATCH";
            } else if (input.dob.getYear() == sanctionData.dob.getYear()) {
                boost += 8.0;
                dobConfidence = "YEAR_MATCH";
            } else {
                penalty -= 8.0;
                dobConfidence = "NO_MATCH";
            }
        }

        if (notBlank(input.nationality) && notBlank(sanctionData.nationality)) {
            String inputNat = normalizeNationality(input.nationality);
            // القائمة ممكن تحتوي جنسيات متعددة مفصولة بـ ; أو , أو |
            boolean natMatch = java.util.Arrays.stream(
                    sanctionData.nationality.split("[;,|]"))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(SanctionSearchResult::normalizeNationality)
                .anyMatch(n -> n.equalsIgnoreCase(inputNat));
            if (natMatch) {
                boost += 10.0;
                nationalityConfidence = "MATCH";
            } else {
                penalty -= 3.0;
                nationalityConfidence = "NO_MATCH";
            }
        }

        double totalDelta = boost + penalty;
        confirmingBoost   = totalDelta;
        score             = clamp(score          + totalDelta);
        nameSimilarity    = clamp(nameSimilarity + totalDelta * 0.5);

        confidenceLevel = resolveConfidence(boost, penalty);
    }

    private String resolveConfidence(double boost, double penalty) {
        if ("CONFIRMED".equals(idConfidence)) {
            return penalty <= -15.0 ? "PROBABLE" : "CONFIRMED";
        }
        if ("EXACT_MATCH".equals(dobConfidence) && boost >= 20.0) {
            return "CONFIRMED";
        }

        boolean hasAnyFactor =
            !"UNAVAILABLE".equals(dobConfidence)         ||
            !"UNAVAILABLE".equals(idConfidence)          ||
            !"UNAVAILABLE".equals(nationalityConfidence) ||
            !"UNAVAILABLE".equals(motherNameConfidence);

        // عدّ كم عامل مختلف — MISMATCH بس لو عاملان أو أكثر مختلفين
        int mismatchCount = 0;
        if ("NO_MATCH".equals(idConfidence))          mismatchCount++;
        if ("NO_MATCH".equals(dobConfidence))          mismatchCount++;
        if ("NO_MATCH".equals(nationalityConfidence))  mismatchCount++;
        if ("NO_MATCH".equals(motherNameConfidence))   mismatchCount++;

        int matchCount = 0;
        if ("CONFIRMED".equals(idConfidence) || "PARTIAL".equals(idConfidence))             matchCount++;
        if ("EXACT_MATCH".equals(dobConfidence) || "YEAR_MATCH".equals(dobConfidence))      matchCount++;
        if ("MATCH".equals(nationalityConfidence))                                           matchCount++;
        if ("CONFIRMED".equals(motherNameConfidence) || "PARTIAL".equals(motherNameConfidence)) matchCount++;

        boolean allMismatch =
            hasAnyFactor &&
            matchCount == 0 &&
            mismatchCount >= 2 &&
            penalty <= -10.0;

        if (allMismatch) {
            nameSimilarity = Math.min(nameSimilarity, 72.0);
            score          = Math.min(score, 72.0);
            return "MISMATCH";
        }

        if (boost >= 30.0) return "CONFIRMED";
        if (boost >= 20.0) return "PROBABLE";
        if (boost >= 10.0) return "POSSIBLE";
        if (boost >= 5.0)  return "LOW_CONFIDENCE";
        return "UNCONFIRMED";
    }

    static String normalizeNationality(String nat) {
        if (nat == null) return "";
        String n = nat.trim().toLowerCase();
        return switch (n) {
            // سوريا
            case "sy", "syrian", "syria", "سوري", "سورية", "سوريا"                     -> "syria";
            // العراق
            case "iq", "iraqi", "iraq", "عراقي", "عراقية", "العراق"                    -> "iraq";
            // الأردن
            case "jo", "jordanian", "jordan", "أردني", "أردنية", "الأردن"              -> "jordan";
            // لبنان
            case "lb", "lebanese", "lebanon", "لبناني", "لبنانية", "لبنان"             -> "lebanon";
            // مصر
            case "eg", "egyptian", "egypt", "مصري", "مصرية", "مصر"                     -> "egypt";
            // السعودية
            case "sa", "saudi", "saudi arabia", "saudi arabian",
                 "سعودي", "سعودية", "السعودية", "المملكة العربية السعودية"             -> "saudi arabia";
            // الإمارات
            case "ae", "emirati", "united arab emirates",
                 "إماراتي", "إماراتية", "الإمارات", "الإمارات العربية المتحدة"         -> "united arab emirates";
            // تركيا
            case "tr", "turkish", "turkey", "تركي", "تركية", "تركيا"                   -> "turkey";
            // إيران
            case "ir", "iranian", "iran", "إيراني", "إيرانية", "إيران"                 -> "iran";
            // روسيا
            case "ru", "russian", "russia", "روسي", "روسية", "روسيا"                   -> "russia";
            // أوكرانيا
            case "ua", "ukrainian", "ukraine", "أوكراني", "أوكرانية", "أوكرانيا"       -> "ukraine";
            // بيلاروسيا
            case "by", "belarusian", "belarus", "بيلاروسي", "بيلاروسيا"               -> "belarus";
            // كازاخستان
            case "kz", "kazakhstani", "kazakhstan", "كازاخستاني", "كازاخستان"          -> "kazakhstan";
            // ليبيا
            case "ly", "libyan", "libya", "ليبي", "ليبية", "ليبيا"                     -> "libya";
            // السودان
            case "sd", "sudanese", "sudan", "سوداني", "سودانية", "السودان"             -> "sudan";
            // اليمن
            case "ye", "yemeni", "yemen", "يمني", "يمنية", "اليمن"                     -> "yemen";
            // باكستان
            case "pk", "pakistani", "pakistan", "باكستاني", "باكستانية", "باكستان"     -> "pakistan";
            // أفغانستان
            case "af", "afghan", "afghanistan", "أفغاني", "أفغانية", "أفغانستان"       -> "afghanistan";
            // الصومال
            case "so", "somali", "somalia", "صومالي", "صومالية", "الصومال"             -> "somalia";
            // كوريا الشمالية
            case "kp", "north korean", "north korea", "كوري شمالي"                     -> "north korea";
            // كوبا
            case "cu", "cuban", "cuba", "كوبي", "كوبا"                                 -> "cuba";
            // فنزويلا
            case "ve", "venezuelan", "venezuela", "فنزويلي", "فنزويلا"                 -> "venezuela";
            // ميانمار
            case "mm", "burmese", "myanmar", "ميانماري", "ميانمار"                     -> "myanmar";
            default -> n;
        };
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    private static double clamp(double v) {
        return Math.min(Math.max(v, 0.0), 100.0);
    }

    private static String normalize(String s) {
        if (s == null) return "";
        return s.trim().toLowerCase()
                .replaceAll("[\\s\\-_']+", " ")
                .replaceAll("[^\\p{L}\\p{N} ]", "");
    }

    private static String normalizeId(String id) {
        return id.toLowerCase().replaceAll("[\\s\\-_]", "").trim();
    }

    private static double simpleNameSim(String a, String b) {
        if (a.equals(b)) return 100.0;
        if (a.isEmpty() || b.isEmpty()) return 0.0;
        int maxLen = Math.max(a.length(), b.length());
        int dist   = levenshtein(a, b);
        return (1.0 - (double) dist / maxLen) * 100.0;
    }

    private static int levenshtein(String a, String b) {
        int[] dp = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) dp[j] = j;
        for (int i = 1; i <= a.length(); i++) {
            int prev = dp[0];
            dp[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                int tmp = dp[j];
                dp[j] = a.charAt(i - 1) == b.charAt(j - 1)
                        ? prev
                        : 1 + Math.min(prev, Math.min(dp[j], dp[j - 1]));
                prev = tmp;
            }
        }
        return dp[b.length()];
    }

    public static class ConfirmingData {
        public final String    nationality;
        public final LocalDate dob;
        public final String    idNumber;
        public final String    idType;
        public final String    motherName;

        public ConfirmingData(String nationality, LocalDate dob,
                String idNumber, String idType, String motherName) {
            this.nationality = nationality;
            this.dob         = dob;
            this.idNumber    = idNumber;
            this.idType      = idType;
            this.motherName  = motherName;
        }

        public static ConfirmingData fromRequest(
                String nationality, LocalDate dob,
                String idNumber, String idType, String motherName) {
            return new ConfirmingData(nationality, dob, idNumber, idType, motherName);
        }

        public boolean isEmpty() {
            return (nationality == null || nationality.isBlank())
                && dob == null
                && (idNumber == null || idNumber.isBlank())
                && (motherName == null || motherName.isBlank());
        }
    }

    public static class SanctionRecordData {
        public final String    nationality;
        public final LocalDate dob;
        public final String    idNumber;
        public final String    motherName;

        public SanctionRecordData(String nationality, LocalDate dob,
                String idNumber, String motherName) {
            this.nationality = nationality;
            this.dob         = dob;
            this.idNumber    = idNumber;
            this.motherName  = motherName;
        }

        public static SanctionRecordData empty() {
            return new SanctionRecordData(null, null, null, null);
        }
    }

    public SanctionSearchResult copy() {
        SanctionSearchResult c = new SanctionSearchResult(id, name, score, source, nameSimilarity, aliasSimilarity);
        c.notes      = this.notes;
        c.wikidataId = this.wikidataId;
        return c;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID   id;
        private String name;
        private Double score           = 0.0;
        private String source          = "PEP";
        private Double nameSimilarity  = 0.0;
        private Double aliasSimilarity = 0.0;
        private String notes;
        private String wikidataId;

        public Builder id(UUID id)                   { this.id = id; return this; }
        public Builder name(String name)             { this.name = name; return this; }
        public Builder score(Double score)           { this.score = score; return this; }
        public Builder source(String source)         { this.source = source; return this; }
        public Builder nameSimilarity(Double v)      { this.nameSimilarity = v; return this; }
        public Builder aliasSimilarity(Double v)     { this.aliasSimilarity = v; return this; }
        public Builder notes(String notes)           { this.notes = notes; return this; }
        public Builder wikidataId(String wikidataId) { this.wikidataId = wikidataId; return this; }

        public SanctionSearchResult build() {
            SanctionSearchResult r = new SanctionSearchResult(
                    id != null ? id : UUID.randomUUID(),
                    name, score, source, nameSimilarity, aliasSimilarity);
            r.notes      = this.notes;
            r.wikidataId = this.wikidataId;
            return r;
        }
    }

    public UUID   getId()                    { return id; }
    public String getName()                  { return name; }
    public Double getScore()                 { return score; }
    public String getSource()                { return source; }
    public Double getNameSimilarity()        { return nameSimilarity; }
    public Double getAliasSimilarity()       { return aliasSimilarity; }
    public String getNotes()                 { return notes; }
    public String getWikidataId()            { return wikidataId; }
    public String getNationalityConfidence() { return nationalityConfidence; }
    public String getDobConfidence()         { return dobConfidence; }
    public String getIdConfidence()          { return idConfidence; }
    public String getMotherNameConfidence()  { return motherNameConfidence; }
    public double getConfirmingBoost()       { return confirmingBoost; }
    public String getConfidenceLevel()       { return confidenceLevel; }
}