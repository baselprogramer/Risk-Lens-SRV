package com.sdn.blacklist.common.util;
 
public class SmartNameMatcherTest {
 
    private static int pass = 0, fail = 0;
 
    static void expect(String cat, String query, String cand, boolean wantMatch) {
        double s = SmartNameMatcher.match(query, cand);
        boolean got = s >= 65.0;
        boolean ok  = got == wantMatch;
        if (ok) pass++; else fail++;
        System.out.printf("%-11s %-22s vs %-28s = %5.1f  %s%n",
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
        expect("guard",      "osama",              "Usama",                      true);   // vowel-initial variant
        expect("guard",      "yousef",             "Yusuf",                      true);
 
        System.out.println("\n-----------------------------");
        System.out.printf("RESULT: %d pass, %d fail%n", pass, fail);
        System.out.println(fail == 0 ? "ALL GREEN" : "SOME FAILED");
    }
}