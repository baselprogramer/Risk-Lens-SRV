package com.sdn.blacklist.common.util;

/**
 * اختبار شامل لتقنيات مطابقة الأسماء التسع.
 * شغّله بزرّ ▶ Run فوق الـ main، أو: java ...SmartNameMatcherTest
 * كل سطر يطبع النسبة ونتيجة النجاح/الفشل.
 *
 * الفئات:
 *  - REGRESSION : تقنيات كانت شغّالة — يجب أن تبقى ≥65
 *  - FIXED      : تقنيات أُصلحت — يجب أن تصبح ≥65
 *  - FP         : مطابقات كاذبة — يجب أن تبقى <65 (أو يحجبها الـ service)
 */
public class SmartNameMatcherTest {

    private static int pass = 0, fail = 0;

    static void expect(String cat, String query, String cand, boolean wantMatch) {
        double s = SmartNameMatcher.match(query, cand);
        boolean got = s >= 65.0;
        boolean ok  = got == wantMatch;
        if (ok) pass++; else fail++;
        System.out.printf("%-11s %-22s vs %-28s = %5.1f  %s%n",
            cat, query, cand, s, ok ? "✓" : "✗ FAIL (توقعنا " + (wantMatch ? "مطابقة" : "لا مطابقة") + ")");
    }

    public static void main(String[] args) {
        System.out.println("═══ REGRESSION — يجب أن تبقى شغّالة ═══");
        expect("1-Phonetic", "husain",             "Hussein",                    true);
        expect("1-Phonetic", "bougourd",           "Bugourd",                    true);
        expect("2-Lev",      "timmy",              "Tommy",                      true);
        expect("4-Equiv",    "mohamed ali",        "Muhammad Ali",               true);
        expect("4-Equiv",    "gaddafi",            "Qaddafi",                    true);
        expect("8-Order",    "sudani watani bank", "Bank Watani Sudani",         true);
        expect("9-Missing",  "abdullah ashqar",    "Abdullah Bin Hasan Ashqar",  true);
        expect("target",     "saddam husien",      "Saddam Hussein Al-Tikriti",  true);
        expect("target",     "bassar alassad",     "Bashar Al-Assad",            true);

        System.out.println("\n═══ FIXED — كانت مكسورة، يجب أن تشتغل ═══");
        expect("2-Madani",   "almadani",           "Almadadi",                   true);  // تلاعب حرف
        expect("3-JaroW",    "martha",             "Marhta",                     true);  // تبديل جواري
        expect("6-Initial",  "j pickard",          "Jean Luc Pickard",           true);  // أحرف مختصرة
        expect("6-Initial",  "m ali",              "Mohammed Ali",               true);
        expect("7-Concat",   "newman",             "new man",                    true);  // دمج/فصل
        expect("7-Concat",   "abdulrahman",        "Abdul Rahman",               true);

        System.out.println("\n═══ FALSE POSITIVES — يجب أن تبقى منخفضة ═══");
        expect("FP",         "khaled ahmad",       "Walid Ahmad",                false);
        expect("FP",         "john smith",         "Ali Hassan",                 false);
        expect("FP",         "ahmed mohamed",      "Ali Hassan",                 false);
        expect("FP",         "omar khaled",        "Osama Walid",                false);
        expect("FP",         "b",                  "Bashar Al-Assad",            false);  // حرف واحد
        expect("FP",         "x smith",            "John Smith",                 false);  // أول حرف خاطئ

        System.out.println("\n─────────────────────────────");
        System.out.printf("النتيجة: %d نجح، %d فشل%n", pass, fail);
        System.out.println(fail == 0 ? "✅ كل الاختبارات نجحت" : "❌ في اختبارات فشلت — راجعها فوق");
    }
}