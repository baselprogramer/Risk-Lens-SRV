package com.sdn.blacklist.common.service;

import com.sdn.blacklist.common.util.SmartNameMatcher;
import com.sdn.blacklist.common.util.SmartNameMatcher.MatchLevel;

public class RiskCalculator {

    public static double listWeight(String source) {
        if (source == null)
            return 1.0;
        return switch (source.toUpperCase().trim()) {
            case "OFAC", "UN" -> 2.0; // أعلى خطورة
            case "EU", "UK" -> 1.8;
            case "INTERPOL" -> 1.6;
            case "LOCAL" -> 1.5;
            case "PEP" -> 1.3; // enhanced DD
            case "WORLD_BANK" -> 1.1;
            default -> 1.0;
        };
    }

    public static int basePoints(MatchLevel level) {
        return switch (level) {
            case EXACT -> 100;
            case STRONG -> 70;
            case PROBABLE -> 40;
            case POSSIBLE -> 20;
            case NO_MATCH -> 0;
        };
    }

    public static int calcNameRiskPoints(double score, String source) {
        MatchLevel level = SmartNameMatcher.classifyScore(score);
        if (level == MatchLevel.NO_MATCH)
            return 0;
        int base = basePoints(level);
        double weight = listWeight(source);
        return (int) Math.round(base * weight);
    }

    public static int calcCountryRiskPoints(double countryRiskScore) {
        if (countryRiskScore <= 0)
            return 0;
        // countryRiskScore من 0-100 حسب FATF tier
        if (countryRiskScore >= 90)
            return 50; // Black List
        if (countryRiskScore >= 70)
            return 40; // High Risk
        if (countryRiskScore >= 50)
            return 25; // Grey List
        if (countryRiskScore >= 30)
            return 10; // Medium Risk
        return 0;
    }

    public static int calcAmountRiskPoints(double amountUsd, String currency) {
        // لو ليرة سورية وما في مكافئ دولار → لا تطبّق الـ threshold
        if ("SYP".equalsIgnoreCase(currency) && amountUsd <= 0)
            return 0;
        if (amountUsd <= 0)
            return 0;

        if (amountUsd >= 10_000)
            return 30;
        if (amountUsd >= 5_000)
            return 15;
        if (amountUsd >= 3_000)
            return 10;
        if (amountUsd >= 1_000)
            return 5;
        return 0;
    }

    public static double applyConfidenceBoost(double points, String confidenceLevel) {
        double multiplier = switch (confidenceLevel != null ? confidenceLevel : "UNCONFIRMED") {
            case "CONFIRMED" -> 1.30;
            case "PROBABLE" -> 1.15;
            case "POSSIBLE" -> 1.05;
            default -> 1.00;
        };
        return points * multiplier;
    }

    /** للـ Screening (Person) */
    public static RiskLevel resolveScreeningRisk(int totalPoints) {
        if (totalPoints == 0)
            return RiskLevel.VERY_LOW;
        if (totalPoints < 40)
            return RiskLevel.LOW;
        if (totalPoints < 80)
            return RiskLevel.MEDIUM;
        if (totalPoints < 150)
            return RiskLevel.HIGH;
        return RiskLevel.CRITICAL;
    }

    /** للـ Transfer */
    public static RiskLevel resolveTransferRisk(int totalPoints) {
        if (totalPoints == 0)
            return RiskLevel.VERY_LOW;
        if (totalPoints < 30)
            return RiskLevel.LOW;
        if (totalPoints < 60)
            return RiskLevel.MEDIUM;
        if (totalPoints < 120)
            return RiskLevel.HIGH;
        return RiskLevel.CRITICAL;
    }

    public static TransferAction resolveTransferAction(int totalPoints) {
        if (totalPoints < 30)
            return TransferAction.APPROVE;
        if (totalPoints < 120)
            return TransferAction.REVIEW;
        return TransferAction.BLOCK;
    }

    public enum RiskLevel {
        VERY_LOW, // لا مطابقة
        LOW, // مطابقة ممكنة — auto approve + log
        MEDIUM, // مراجعة مطلوبة
        HIGH, // مراجعة كبار + إضافي
        CRITICAL // حجب فوري + تصعيد
    }

    // TransferAction — قرار التحويل

    public enum TransferAction {
        APPROVE, // موافقة
        REVIEW, // مراجعة
        BLOCK // حجب + SAR report
    }

    private RiskCalculator() {
    }
}