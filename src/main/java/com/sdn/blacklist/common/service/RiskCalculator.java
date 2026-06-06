package com.sdn.blacklist.common.service;

import com.sdn.blacklist.common.util.SmartNameMatcher;
import com.sdn.blacklist.common.util.SmartNameMatcher.MatchLevel;

/**
 * RiskCalculator — حساب النقاط المركزي لنظام AML/Sanctions
 *
 * مبني على معايير:
 *  - FATF Recommendations 1, 10, 29
 *  - Wolfsberg Group AML Principles
 *  - Egmont Group Standards
 *
 * يُستخدم من:
 *  - ScreeningService   (فحص الأشخاص)
 *  - TransferScreeningService (فحص التحويلات)
 */
public class RiskCalculator {

    // ══════════════════════════════════════════
    //  LIST WEIGHTS — أوزان القوائم
    //
    //  OFAC SDN وUN Consolidated: أخطر القوائم
    //  بالعالم — تجميد فوري بمعظم التشريعات
    //
    //  EU وUK: إلزامية قانونياً لمن يعمل بأوروبا/بريطانيا
    //
    //  PEP: مخاطر الفساد — ليست عقوبات لكن enhanced DD
    //
    //  INTERPOL: Red Notice = مطلوب دولياً
    // ══════════════════════════════════════════
    public static double listWeight(String source) {
        if (source == null) return 1.0;
        return switch (source.toUpperCase().trim()) {
            case "OFAC", "UN"          -> 2.0;  // أعلى خطورة
            case "EU", "UK"            -> 1.8;
            case "INTERPOL"            -> 1.6;
            case "LOCAL"               -> 1.5;
            case "PEP"                 -> 1.3;  // enhanced DD
            case "WORLD_BANK"          -> 1.1;
            default                    -> 1.0;
        };
    }

    // ══════════════════════════════════════════
    //  BASE POINTS — نقاط المطابقة الأساسية
    //
    //  مبنية على MatchLevel:
    //  EXACT    → 100 pts (تطابق تام = خطر أكيد)
    //  STRONG   →  70 pts (تطابق قوي)
    //  PROBABLE →  40 pts (تطابق محتمل)
    //  POSSIBLE →  20 pts (تطابق ممكن = مراجعة)
    //  NO_MATCH →   0 pts
    // ══════════════════════════════════════════
    public static int basePoints(MatchLevel level) {
        return switch (level) {
            case EXACT    -> 100;
            case STRONG   ->  70;
            case PROBABLE ->  40;
            case POSSIBLE ->  20;
            case NO_MATCH ->   0;
        };
    }

    // ══════════════════════════════════════════
    //  calcNameRiskPoints — نقاط المطابقة
    //
    //  النقاط = basePoints × listWeight
    //
    //  مثال:
    //  EXACT match على OFAC  = 100 × 2.0 = 200 pts → CRITICAL
    //  STRONG match على EU   =  70 × 1.8 = 126 pts → HIGH
    //  PROBABLE match على PEP =  40 × 1.3 =  52 pts → MEDIUM
    //  POSSIBLE match على UK  =  20 × 1.8 =  36 pts → LOW
    // ══════════════════════════════════════════
    public static int calcNameRiskPoints(double score, String source) {
        MatchLevel level = SmartNameMatcher.classifyScore(score);
        if (level == MatchLevel.NO_MATCH) return 0;
        int    base   = basePoints(level);
        double weight = listWeight(source);
        return (int) Math.round(base * weight);
    }

    // ══════════════════════════════════════════
    //  calcCountryRiskPoints — نقاط خطر البلد
    //
    //  مبنية على FATF Country Risk Classification:
    //  Black List (Iran, North Korea, Myanmar) → +50
    //  Grey List  (FATF monitored)             → +25
    //  High Risk  (OFAC sanctioned countries)  → +40
    //  Medium Risk                             → +10
    //  Low Risk                                →  +0
    // ══════════════════════════════════════════
    public static int calcCountryRiskPoints(double countryRiskScore) {
        if (countryRiskScore <= 0) return 0;
        // countryRiskScore من 0-100 حسب FATF tier
        if (countryRiskScore >= 90) return 50;  // Black List
        if (countryRiskScore >= 70) return 40;  // High Risk
        if (countryRiskScore >= 50) return 25;  // Grey List
        if (countryRiskScore >= 30) return 10;  // Medium Risk
        return 0;
    }

    // ══════════════════════════════════════════
    //  calcAmountRiskPoints — نقاط المبلغ
    //
    //  مبنية على FATF Recommendation 29 (CTR):
    //  ≥ $10,000 → +30 pts (CTR mandatory threshold)
    //  ≥  $5,000 → +15 pts (wire transfer threshold)
    //  ≥  $3,000 → +10 pts (FATF Rec. 16)
    //  ≥  $1,000 → + 5 pts (structuring watch)
    // ══════════════════════════════════════════
    public static int calcAmountRiskPoints(double amountUsd, String currency) {
        // لو ليرة سورية وما في مكافئ دولار → لا تطبّق الـ threshold
        if ("SYP".equalsIgnoreCase(currency) && amountUsd <= 0) return 0;
        if (amountUsd <= 0) return 0;

        if (amountUsd >= 10_000) return 30;
        if (amountUsd >=  5_000) return 15;
        if (amountUsd >=  3_000) return 10;
        if (amountUsd >=  1_000) return  5;
        return 0;
    }

    // ══════════════════════════════════════════
    //  applyConfidenceBoost — تعديل الـ confirming factors
    //
    //  لما بيتأكد الـ match بعوامل إضافية:
    //  CONFIRMED  → ×1.30 (DOB + جنسية + ID)
    //  PROBABLE   → ×1.15 (عاملين من ثلاثة)
    //  POSSIBLE   → ×1.05 (عامل وحدة)
    //  UNCONFIRMED→ ×1.00 (بدون تأكيد)
    // ══════════════════════════════════════════
    public static double applyConfidenceBoost(double points, String confidenceLevel) {
        double multiplier = switch (confidenceLevel != null ? confidenceLevel : "UNCONFIRMED") {
            case "CONFIRMED"  -> 1.30;
            case "PROBABLE"   -> 1.15;
            case "POSSIBLE"   -> 1.05;
            default           -> 1.00;
        };
        return points * multiplier;
    }

    // ══════════════════════════════════════════
    //  RISK LEVEL THRESHOLDS — حدود مستوى الخطر
    //
    //  مصممة بحيث:
    //  - POSSIBLE match على أي قائمة = LOW على الأقل
    //  - PROBABLE match على OFAC = HIGH (40 × 2.0 = 80)
    //  - EXACT match على OFAC = CRITICAL (100 × 2.0 = 200)
    //  - EXACT match على PEP وحده = MEDIUM (100 × 1.3 = 130)
    // ══════════════════════════════════════════

    /** للـ Screening (Person) */
    public static RiskLevel resolveScreeningRisk(int totalPoints) {
        if (totalPoints == 0)    return RiskLevel.VERY_LOW;
        if (totalPoints < 40)    return RiskLevel.LOW;
        if (totalPoints < 80)    return RiskLevel.MEDIUM;
        if (totalPoints < 150)   return RiskLevel.HIGH;
        return                          RiskLevel.CRITICAL;
    }

    /** للـ Transfer */
    public static RiskLevel resolveTransferRisk(int totalPoints) {
        if (totalPoints == 0)    return RiskLevel.VERY_LOW;
        if (totalPoints < 30)    return RiskLevel.LOW;
        if (totalPoints < 60)    return RiskLevel.MEDIUM;
        if (totalPoints < 120)   return RiskLevel.HIGH;
        return                          RiskLevel.CRITICAL;
    }

    /** Transfer Action — APPROVE / REVIEW / BLOCK */
    public static TransferAction resolveTransferAction(int totalPoints) {
        if (totalPoints < 30)  return TransferAction.APPROVE;
        if (totalPoints < 120) return TransferAction.REVIEW;
        return                        TransferAction.BLOCK;
    }

    // ══════════════════════════════════════════
    //  RiskLevel — مستوى الخطر الموحّد
    //  يُستخدم من ScreeningService و TransferScreeningService
    // ══════════════════════════════════════════
    public enum RiskLevel {
        VERY_LOW,   // لا مطابقة
        LOW,        // مطابقة ممكنة — auto approve + log
        MEDIUM,     // مراجعة مطلوبة
        HIGH,       // مراجعة كبار + إضافي
        CRITICAL    // حجب فوري + تصعيد
    }

    // ══════════════════════════════════════════
    //  TransferAction — قرار التحويل
    // ══════════════════════════════════════════
    public enum TransferAction {
        APPROVE,  // موافقة
        REVIEW,   // مراجعة
        BLOCK     // حجب + SAR report
    }

    // ══════════════════════════════════════════
    //  جدول مرجعي — سيناريوهات حقيقية
    //
    //  "Bashar Al Assad" exact vs OFAC:
    //    100 pts × 2.0 = 200 → CRITICAL ✅
    //
    //  "Bashar Al Assad" exact vs EU:
    //    100 pts × 1.8 = 180 → CRITICAL ✅
    //
    //  "Amjad Youssef" strong vs EU+UK+PEP:
    //    max(70×1.8, 70×1.8, 70×1.3) = 126 → HIGH ✅
    //    مع PEP: إضافي → ≥ 150 → CRITICAL ✅
    //
    //  Unknown person possible match vs LOCAL:
    //    20 × 1.5 = 30 → LOW → auto approve ✅
    // ══════════════════════════════════════════

    private RiskCalculator() {} // utility class — لا instantiation
}