package com.sdn.blacklist.common.service;

import com.sdn.blacklist.common.util.SmartNameMatcher;
import com.sdn.blacklist.common.util.SmartNameMatcher.MatchLevel;

public class RiskCalculator {

    public static double listWeight(String source) {
        if (source == null) return 1.0;
        return switch (source.toUpperCase().trim()) {
            case "OFAC", "UN"  -> 2.0;
            case "EU", "UK"    -> 1.8;
            case "INTERPOL"    -> 1.6;
            case "LOCAL"       -> 1.5;
            case "PEP"         -> 1.3;
            case "WORLD_BANK"  -> 1.1;
            default            -> 1.0;
        };
    }

    public static int basePoints(MatchLevel level) {
        return switch (level) {
            case EXACT    -> 100;
            case STRONG   -> 70;
            case PROBABLE -> 40;
            case POSSIBLE -> 20;
            case NO_MATCH -> 0;
        };
    }

    public static int calcNameRiskPoints(double score, String source) {
        MatchLevel level = SmartNameMatcher.classifyScore(score);
        if (level == MatchLevel.NO_MATCH) return 0;
        int base = basePoints(level);
        double weight = listWeight(source);
        return (int) Math.round(base * weight);
    }

    public static int calcCountryRiskPoints(double countryRiskScore) {
        if (countryRiskScore <= 0) return 0;
        if (countryRiskScore >= 90) return 50;
        if (countryRiskScore >= 70) return 40;
        if (countryRiskScore >= 50) return 25;
        if (countryRiskScore >= 30) return 10;
        return 0;
    }

    public static int calcAmountRiskPoints(double amountUsd, String currency) {
        if ("SYP".equalsIgnoreCase(currency) && amountUsd <= 0) return 0;
        if (amountUsd <= 0) return 0;
        if (amountUsd >= 10_000) return 30;
        if (amountUsd >= 5_000)  return 15;
        if (amountUsd >= 3_000)  return 10;
        if (amountUsd >= 1_000)  return 5;
        return 0;
    }

    // ══════════════════════════════════════════
    //  applyConfidenceBoost — ما تغيّر
    // ══════════════════════════════════════════
    public static double applyConfidenceBoost(double points, String confidenceLevel) {
        double multiplier = switch (confidenceLevel != null ? confidenceLevel : "UNCONFIRMED") {
            case "CONFIRMED"       -> 1.4;
            case "PROBABLE"        -> 1.2;
            case "POSSIBLE"        -> 1.0;
            case "LOW_CONFIDENCE"  -> 0.85;
            case "UNCONFIRMED"     -> 0.7;
            case "MISMATCH"        -> 0.3;
            default                -> 1.0;
        };
        return points * multiplier;
    }

    //  ثلاث درجات: LOW / MEDIUM / HIGH — القديم VERY_LOW صار LOW، والقديم CRITICAL صار HIGH
    public static RiskLevel resolveScreeningRisk(int totalPoints) {
        if (totalPoints < 40)  return RiskLevel.LOW;      // كان 0→VERY_LOW و <40→LOW
        if (totalPoints < 80)  return RiskLevel.MEDIUM;
        return RiskLevel.HIGH;                            // كان <150→HIGH والباقي→CRITICAL
    }

    public static RiskLevel resolveTransferRisk(int totalPoints) {
        if (totalPoints < 30)  return RiskLevel.LOW;      // كان 0→VERY_LOW و <30→LOW
        if (totalPoints < 60)  return RiskLevel.MEDIUM;
        return RiskLevel.HIGH;                            // كان <120→HIGH والباقي→CRITICAL
    }

    //  resolveTransferAction — ما تغيّر إطلاقاً (الإجراء مستقل عن درجة الخطورة)
    public static TransferAction resolveTransferAction(int totalPoints) {
        if (totalPoints < 30)  return TransferAction.APPROVE;
        if (totalPoints < 120) return TransferAction.REVIEW;
        return TransferAction.BLOCK;
    }

    //  ثلاث درجات نظيفة
    public enum RiskLevel {
        LOW,
        MEDIUM,
        HIGH
    }

    public enum TransferAction {
        APPROVE,
        REVIEW,
        BLOCK
    }

    private RiskCalculator() {}
}