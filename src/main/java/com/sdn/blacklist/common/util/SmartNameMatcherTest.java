package com.sdn.blacklist.common.util;

public class SmartNameMatcherTest {

    private static int pass = 0, fail = 0;

    static void expect(String cat, String query, String cand, boolean wantMatch) {
        double s = SmartNameMatcher.match(query, cand);
        boolean got = s >= 65.0;
        boolean ok  = got == wantMatch;
        if (ok) pass++; else fail++;
        System.out.printf("%-13s %-24s vs %-28s = %5.1f  %s%n",
            cat, query, cand, s, ok ? "OK" : "XX FAIL (want " + (wantMatch ? "match" : "no-match") + ")");
    }

    public static void main(String[] args) {
        System.out.println("=== REGRESSION ===");
        expect("1-Phonetic", "husain",             "Hussein",                    true);
        expect("1-Phonetic", "bougourd",           "Bugourd",                    true);
        expect("2-Lev",      "timmy",              "Tommy",                      true);
        expect("4-Equiv",    "mohamed ali",        "Muhammad Ali",               true);
        expect("4-Equiv",    "gaddafi",            "Qaddafi",                    true);
        expect("8-Order",    "sudani watani bank", "Bank Watani Sudani",         true);
        expect("9-Missing",  "abdullah ashqar",    "Abdullah Bin Hasan Ashqar",  true);
        expect("target",     "saddam husien",      "Saddam Hussein Al-Tikriti",  true);
        expect("target",     "bassar alassad",     "Bashar Al-Assad",            true);

        System.out.println("\n=== FIXED ===");
        expect("2-Madani",   "almadani",           "Almadadi",                   true);
        expect("3-JaroW",    "martha",             "Marhta",                     true);
        expect("6-Initial",  "j pickard",          "Jean Luc Pickard",           true);
        expect("6-Initial",  "m ali",              "Mohammed Ali",               true);
        expect("7-Concat",   "newman",             "new man",                    true);
        expect("7-Concat",   "abdulrahman",        "Abdul Rahman",               true);

        System.out.println("\n=== FALSE POSITIVES (existing) ===");
        expect("FP",         "khaled ahmad",       "Walid Ahmad",                false);
        expect("FP",         "john smith",         "Ali Hassan",                 false);
        expect("FP",         "ahmed mohamed",      "Ali Hassan",                 false);
        expect("FP",         "omar khaled",        "Osama Walid",                false);
        expect("FP",         "b",                  "Bashar Al-Assad",            false);
        expect("FP",         "x smith",            "John Smith",                 false);
        expect("FP",         "khalid alwalid",     "O2 KLAUD",                   false);

        System.out.println("\n=== NEW FP (wasim asad case) ===");
        expect("FP-new",     "wasim asid",         "Asim Umar",                  false);
        expect("FP-new",     "wasim asid",         "Asim Sarajlic",              false);
        expect("FP-new",     "wasim asid",         "Abu Asim Al-Makki",          false);
        expect("FP-new",     "wasim asid",         "Asma Al Asad",               false);
        expect("FP-new-ar",  "\u0648\u0633\u064a\u0645 \u0623\u0633\u062f", "\u0623\u0633\u0645\u0627\u0621 \u0627\u0644\u0623\u0633\u062f", false);

        System.out.println("\n=== EXTRA REGRESSION GUARDS ===");
        expect("guard",      "sdam hossien",       "Saddam Hussein",             true);
        expect("guard",      "osama",              "Usama",                      true);
        expect("guard",      "yousef",             "Yusuf",                      true);

        // ══════════════════════════════════════════════════════════════════
        //  إصلاحات التدقيق الخارجي (تموز ٢٠٢٦) — homoglyph + diacritics
        //  (#3, #5) — بطبقة الـ preClean. reorder (#1) بيتأكد إن الـ matcher
        //  ضلّ order-tolerant (الإصلاح الفعلي للترتيب بالـ SanctionSearchService).
        // ══════════════════════════════════════════════════════════════════
        System.out.println("\n=== AUDIT FIX: homoglyphs (#3) ===");
        // أحرف كيريلية تشبه اللاتيني: а е о р с х
        expect("homoglyph",  "\u0430li mus\u0430", "Ali Musa",                   true);  // аli musа
        expect("homoglyph",  "b\u0430sh\u0430r \u0430l \u0430ss\u0430d", "Bashar Al-Assad", true); // bаshаr...
        expect("homoglyph",  "\uff21\uff2c\uff29", "Ali",                        true);  // fullwidth ＡＬＩ

        System.out.println("\n=== AUDIT FIX: diacritics / extended-latin (#5) ===");
        expect("diacritic",  "jos\u00e9",          "Jose",                       true);  // josé
        expect("diacritic",  "b\u0159e\u017ean",   "Brezan",                     true);  // břežan
        expect("ext-latin",  "\u0142ukasz",        "Lukasz",                     true);  // łukasz
        expect("ext-latin",  "\u00f8mar",          "Omar",                       true);  // ømar
        expect("diacritic",  "nguy\u1ec5n",        "Nguyen",                     true);  // nguyễn
        // guard: homoglyph مش لازم يخلق FP
        expect("homo-guard", "\u0430li mus\u0430", "Omar Khaled",                false);

        System.out.println("\n=== AUDIT FIX: reorder stays order-tolerant (#1 guard) ===");
        expect("reorder",    "nyakuni james",      "James Nyakuni",              true);
        expect("reorder",    "rabi fazl",          "Fazl Rabi",                  true);
        expect("reorder",    "rahmani mohammad hasan", "Mohammad Hasan Rahmani", true);

        System.out.println("\n=== AUDIT FIX: vowel variant y<->i (#2 compound) ===");
        expect("vowel",      "maychu aly",         "Ali Maychou",                true);
        expect("vowel",      "al-shawak aly musa", "Ali Musa Al-Shawakh",        true);
        expect("vowel",      "khaled aly",         "Khaled Ali",                 true);
        expect("vowel-fp",   "aly",                "ala",                        false);

        System.out.println("\n=== AUDIT FIX: query-superset (اسم أطول يمسك سجل أقصر) ===");
        expect("superset",   "ali hasan mamlouk",  "Ali Mamluk",                 true);
        expect("superset",   "saddam hussein al majid", "Saddam Hussein",        true);
        expect("superset-fp","khaled ahmad ali",   "Walid Ali",                  false);
        expect("superset-fp","omar khaled ibrahim","Osama Ibrahim",              false);

        System.out.println("\n-----------------------------");
        System.out.printf("RESULT: %d pass, %d fail%n", pass, fail);
        System.out.println(fail == 0 ? "ALL GREEN" : "SOME FAILED");
    }
}