package com.sdn.blacklist.common.util;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.apache.commons.codec.language.DoubleMetaphone;

public class SmartNameMatcher {

    private static final DoubleMetaphone DM = new DoubleMetaphone();

    private static final Set<String> STOPWORDS = Set.of(
            "al", "el", "bin", "bint", "abu", "von", "van", "de", "the", "for", "and", "of", "ibn", "al-");

    public enum MatchLevel {
        EXACT, STRONG, PROBABLE, POSSIBLE, NO_MATCH
    }

    public record MatchResult(double score, MatchLevel level) {
        public boolean isMatch()  { return level != MatchLevel.NO_MATCH; }
        public String levelName() { return level.name(); }
        public static MatchResult noMatch()       { return new MatchResult(0.0, MatchLevel.NO_MATCH); }
        public static MatchResult of(double score){ return new MatchResult(score, classifyScore(score)); }
    }

    public static MatchLevel classifyScore(double score) {
        if (score >= 95.0) return MatchLevel.EXACT;
        if (score >= 85.0) return MatchLevel.STRONG;
        if (score >= 75.0) return MatchLevel.PROBABLE;
        if (score >= 70.0) return MatchLevel.POSSIBLE;
        return MatchLevel.NO_MATCH;
    }

    public static MatchResult matchWithLevel(String query, String candidate, List<String> aliases) {
        double score = match(query, candidate, aliases);
        return MatchResult.of(score);
    }

    public static MatchResult matchWithLevel(String query, String candidate) {
        return matchWithLevel(query, candidate, List.of());
    }

    // ══════════════════════════════════════════
    //  MAIN ENTRY POINT
    // ══════════════════════════════════════════
    public static double match(String query, String candidate, List<String> aliases) {
        if (query == null || candidate == null) return 0.0;

        String qRaw = query.trim().toLowerCase();
        String cRaw = candidate.trim().toLowerCase();

        boolean qIsAr = isArabic(qRaw);
        boolean cIsAr = isArabic(cRaw);

        String qN = qIsAr ? normalizeAr(qRaw) : normalizeEn(qRaw);
        String cN = cIsAr ? normalizeAr(cRaw) : normalizeEn(cRaw);

        if (qN.equals(cN)) return 100.0;

        String qTr = qIsAr ? transliterate(qN) : qN;
        String cTr = cIsAr ? transliterate(cN) : cN;

        List<String> tQ   = tokenize(qN);
        List<String> tC   = tokenize(cN);
        List<String> tQs  = sig(tQ);
        List<String> tCs  = sig(tC);
        List<String> tQtr = tokenize(qTr);
        List<String> tCtr = tokenize(cTr);
        List<String> tQtrs = sig(tQtr);

        List<List<String>> aliasToks   = buildAliasToks(aliases, false);
        List<List<String>> aliasTrToks = buildAliasToks(aliases, true);

        double best = 0.0;

        // ── 1. Direct (نفس اللغة) ──
        if (qIsAr == cIsAr) {
            if (!tQs.isEmpty() && !tCs.isEmpty()) {
                best = max(best, f1WithOrder(tQs, tCs));
                best = max(best, subset(tQs, tCs, isPersonName(tCs) ? 0.55 : 0.35));
                best = max(best, firstLastMatch(tQs, tCs));
            }
            best = max(best, phoneticSimilarity(qN, cN) * 0.92);
        }

        // ── 2. Cross-language ──
        if (qIsAr && !cIsAr) {
            best = max(best, f1WithOrder(tQtrs, tCs) * 0.93);
            if (!tQtrs.isEmpty() && !tCs.isEmpty()) {
                best = max(best, subset(tQtrs, tCs, isPersonName(tCs) ? 0.55 : 0.35) * 0.93);
                best = max(best, firstLastMatch(tQtrs, tCs) * 0.93);
                best = max(best, phoneticSimilarity(qTr, cRaw) * 0.90);
            }
            best = max(best, phoneticSimilarity(qN, cN) * 0.92);
        } else if (!qIsAr && cIsAr) {
            List<String> tCtrs = sig(tCtr);
            best = max(best, f1WithOrder(tQ, tCtr) * 0.93);
            if (!tQs.isEmpty() && !tCtrs.isEmpty()) {
                best = max(best, f1WithOrder(tQs, tCtrs) * 0.93);
                best = max(best, subset(tQs, tCtrs, isPersonName(tCtrs) ? 0.55 : 0.35) * 0.93);
                best = max(best, firstLastMatch(tQs, tCtrs) * 0.93);
                best = max(best, phoneticSimilarity(qRaw, cTr) * 0.90);
            }
        }

        // ── 3. Alias list matching ──
        if (!aliasToks.isEmpty()) {
            best = max(best, alias1OnList(tQ, aliasToks));
            if (qIsAr) {
                best = max(best, alias1OnList(tQtr, aliasToks)   * 0.93);
                best = max(best, alias1OnList(tQtr, aliasTrToks) * 0.93);
            }
            for (int i = 0; i < aliasToks.size(); i++) {
                List<String> alT  = aliasToks.get(i);
                List<String> alS  = sig(alT);
                List<String> alTr = i < aliasTrToks.size() ? aliasTrToks.get(i) : alT;
                best = max(best, f1WithOrder(tQ, alT));
                if (!tQs.isEmpty() && !alS.isEmpty()) {
                    best = max(best, f1WithOrder(tQs, alS));
                    best = max(best, subset(tQs, alS, 0.55));
                    best = max(best, firstLastMatch(tQs, alS));
                }
                if (qIsAr && !tQtrs.isEmpty()) {
                    best = max(best, f1WithOrder(tQtrs, alS)          * 0.93);
                    best = max(best, f1WithOrder(tQtrs, sig(alTr))    * 0.93);
                }
            }
        }

        return Math.min(best, 100.0);
    }

    public static double match(String query, String candidate) {
        return match(query, candidate, List.of());
    }

    public static double matchBest(String query, List<String> candidates) {
        if (candidates == null || candidates.isEmpty()) return 0.0;
        return candidates.stream().mapToDouble(c -> match(query, c)).max().orElse(0.0);
    }

    // ══════════════════════════════════════════
    //  F1 WITH ORDER PENALTY
    //
    //  الفكرة: بعد حساب الـ f1 العادي، نحسب
    //  ترتيب الـ tokens — لو معكوس ننزل الـ score
    //
    //  مثال:
    //  query="صالح علي"  → tokens=[صالح, علي]
    //  cand ="علي صالح"  → tokens=[علي, صالح]
    //  f1 عادي = 100%  ← المشكلة
    //  order penalty = 0.82  → final = 82%  ← صح
    //
    //  لو الاسمين بنفس الترتيب → penalty = 1.0 (لا تأثير)
    // ══════════════════════════════════════════
    private static double f1WithOrder(List<String> tA, List<String> tB) {
        double base = f1(tA, tB);
        if (base < 50.0) return base;
        double penalty = orderPenalty(tA, tB);
        return base * penalty;
    }

    // ══════════════════════════════════════════
    //  orderPenalty
    //  بيحسب كم الترتيب متوافق بين الاسمين
    //  1.0 = نفس الترتيب تماماً
    //  0.82 = ترتيب معكوس كلياً (مثل صالح علي ↔ علي صالح)
    // ══════════════════════════════════════════
    private static double orderPenalty(List<String> tA, List<String> tB) {
        List<String> sA = sig(tA);
        List<String> sB = sig(tB);

        // لو الاسم كلمة واحدة → ما في ترتيب يُحسب
        if (sA.size() <= 1 || sB.size() <= 1) return 1.0;

        // بناء mapping: كل token من A → أقرب موقع له في B
        int n = Math.min(sA.size(), sB.size());
        int[] posA = new int[n];
        int[] posB = new int[n];

        for (int i = 0; i < n; i++) {
            String ta = sA.get(i);
            int bestPos = -1;
            double bestSim = 0;
            for (int j = 0; j < sB.size(); j++) {
                double sim = levenshteinSimilarity(ta, sB.get(j));
                if (sim > bestSim) { bestSim = sim; bestPos = j; }
            }
            posA[i] = i;
            posB[i] = bestPos >= 0 ? bestPos : i;
        }

        // احسب كم pairs بنفس الترتيب النسبي (Kendall tau-like)
        int concordant = 0, discordant = 0;
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                int dA = posA[j] - posA[i];
                int dB = posB[j] - posB[i];
                if (dA * dB > 0) concordant++;
                else if (dA * dB < 0) discordant++;
            }
        }

        int total = concordant + discordant;
        if (total == 0) return 1.0;

        double tau = (double)(concordant - discordant) / total;
        // tau range: -1 (عكسي كلي) إلى +1 (متوافق كلي)
        // نحوّله لـ penalty: 0.82 إلى 1.0
        // لو tau = -1 → penalty = 0.82
        // لو tau = +1 → penalty = 1.0
        return 0.82 + (tau + 1.0) / 2.0 * 0.18;
    }

    // ══════════════════════════════════════════
    //  F1 SCORE — الأصلي (بدون order)
    // ══════════════════════════════════════════
    private static double f1(List<String> tA, List<String> tB) {
        if (tA.isEmpty() || tB.isEmpty()) return 0.0;
        double cv = coverage(tA, tB);
        double pr = coverage(tB, tA);
        if (cv + pr == 0) return 0.0;
        double f1 = 2 * cv * pr / (cv + pr);
        double lp = Math.sqrt((double) Math.min(tA.size(), tB.size()) / Math.max(tA.size(), tB.size()));
        return f1 * lp * 100.0;
    }

    private static double coverage(List<String> from, List<String> to) {
        if (from.isEmpty()) return 0.0;
        double matched = 0;
        for (String t : from) {
            double b = bestMatch(t, to);
            if (b >= 85.0)      matched += 1.0;
            else if (b >= 65.0) matched += 0.5;
            else if (b >= 50.0) matched += 0.25;
        }
        return matched / from.size();
    }

    private static double subset(List<String> tQ, List<String> tC, double minRatio) {
        if (tQ.isEmpty() || tC.isEmpty()) return 0.0;
        double ratio = (double) tQ.size() / tC.size();
        if (ratio < minRatio || ratio > 1.0) return 0.0;
        double me = tQ.stream().filter(t -> bestMatch(t, tC) >= 85.0).count();
        double mf = tQ.stream().filter(t -> { double b = bestMatch(t, tC); return b >= 65 && b < 85; }).count();
        double q  = (me + mf * 0.5) / tQ.size();
        if (q < 0.85) return 0.0;
        return Math.min(70.0 + ratio * q * 25.0, 95.0);
    }

    private static double firstLastMatch(List<String> tQs, List<String> tCs) {
        if (tQs.size() < 2 || tCs.isEmpty()) return 0.0;
        boolean allPresent = tQs.stream().allMatch(t -> bestMatch(t, tCs) >= 82.0);
        if (!allPresent) return 0.0;
        double ratio = (double) tQs.size() / tCs.size();
        if (ratio < 0.33) return 0.0;
        return Math.min(72.0 + ratio * 20.0, 88.0);
    }

    private static double alias1OnList(List<String> tQ, List<List<String>> aliasList) {
        List<String> sq = sig(tQ);
        if (sq.size() != 1) return 0.0;
        String qt = sq.get(0);
        if (qt.length() < 3) return 0.0;
        for (List<String> alT : aliasList) {
            List<String> alS = sig(alT);
            if (alS.isEmpty()) continue;
            double b = bestMatch(qt, alS);
            if (b >= 90.0) return 88.0;
            if (b >= 80.0) return 76.0;
        }
        return 0.0;
    }

    private static double bestMatch(String t, List<String> tokens) {
        return tokens.stream().mapToDouble(c -> levenshteinSimilarity(t, c)).max().orElse(0.0);
    }

    private static List<String> sig(List<String> toks) {
        return toks.stream().filter(t -> !STOPWORDS.contains(t)).collect(Collectors.toList());
    }

    private static boolean isPersonName(List<String> tCs) { return tCs.size() <= 5; }
    private static double max(double a, double b)          { return Math.max(a, b); }

    // ══════════════════════════════════════════
    //  PHONETIC
    // ══════════════════════════════════════════
    public static double phoneticSimilarity(String a, String b) {
        if (a == null || b == null) return 0.0;
        List<String> tA = tokenize(normalizeAr(a));
        List<String> tB = tokenize(normalizeAr(b));
        if (tA.isEmpty() || tB.isEmpty()) return 0.0;
        double covAB = phoneticCoverage(tA, tB);
        double covBA = phoneticCoverage(tB, tA);
        if (covAB + covBA == 0) return 0.0;
        double f1 = 2 * covAB * covBA / (covAB + covBA);
        double lp = Math.sqrt((double) Math.min(tA.size(), tB.size()) / Math.max(tA.size(), tB.size()));
        return f1 * lp * 92.0;
    }

    private static double phoneticCoverage(List<String> from, List<String> to) {
        if (from.isEmpty()) return 0.0;
        int matched = 0;
        for (String ta : from) {
            String pa = DM.doubleMetaphone(ta);
            for (String tb : to) {
                String pb = DM.doubleMetaphone(tb);
                if (pa != null && !pa.isEmpty() && pa.equals(pb)) { matched++; break; }
            }
        }
        return (double) matched / from.size();
    }

    public static double crossLanguageSimilarity(String a, String b) {
        if (a == null || b == null) return 0.0;
        boolean aAr = isArabic(a);
        boolean bAr = isArabic(b);
        if (aAr == bAr) return 0.0;
        String arabic = aAr ? a : b;
        String latin  = aAr ? b : a;
        String translit = transliterate(normalizeAr(arabic));
        List<String> tT = tokenize(translit);
        List<String> tL = tokenize(normalizeEn(latin));
        double f1Score = f1(tT, tL);
        double phon    = phoneticSimilarity(translit, latin);
        return Math.max(f1Score, phon) * 0.90;
    }

    public static String arabicTransliterate(String arabic) { return transliterate(arabic); }

    private static List<List<String>> buildAliasToks(List<String> aliases, boolean transliterate) {
        if (aliases == null) return List.of();
        return aliases.stream().map(a -> {
            boolean ar = isArabic(a);
            String n = ar ? normalizeAr(a.trim().toLowerCase()) : normalizeEn(a.trim().toLowerCase());
            return tokenize(transliterate && ar ? transliterate(n) : n);
        }).collect(Collectors.toList());
    }

    // ══════════════════════════════════════════
    //  NORMALIZE
    // ══════════════════════════════════════════
    public static String normalizeAr(String s) {
        if (s == null) return "";
        s = s.trim().toLowerCase();
        s = s.replaceAll("[\\u064B-\\u065F\\u0670]", "");
        s = s.replaceAll("[\\u0623\\u0625\\u0622\\u0671]", "\u0627");
        s = s.replaceAll("[\\u064A\\u0649\\u0626]", "\u064A");
        s = s.replaceAll("\u0629", "\u0647");
        s = s.replaceAll("\\s+", " ").trim();
        return s;
    }

    public static String normalizeEn(String s) {
        if (s == null) return "";
        s = s.trim().toLowerCase();
        s = s.replaceAll("[\\-_\\.]", " ");
        s = s.replaceAll("\\bel\\b", "al");
        s = s.replaceAll("\\bel\\s", "al ");
        s = s.replaceAll("\\bal([a-z]{3,})\\b", "al $1");
        s = s.replaceAll("\\s+", " ").trim();
        return s;
    }

    public static String normalize(String s) {
        if (s == null) return "";
        return isArabic(s) ? normalizeAr(s) : normalizeEn(s);
    }

    // ══════════════════════════════════════════
    //  TOKENIZE
    // ══════════════════════════════════════════
    public static List<String> tokenize(String name) {
        if (name == null || name.isBlank()) return List.of();
        return Arrays.stream(name.trim().split("[\\s\\-_\\.'،,]+"))
                .map(t -> t.replaceAll("[^a-zA-Z\\u0600-\\u06FF]", ""))
                .filter(t -> t.length() > 1)
                .collect(Collectors.toList());
    }

    // ══════════════════════════════════════════
    //  TRANSLITERATION
    // ══════════════════════════════════════════
    public static String transliterate(String arabic) {
        if (arabic == null || arabic.isBlank()) return "";
        String s = normalizeAr(arabic.trim().toLowerCase());

        // معالجة التعابير المركبة أولاً
        s = s.replace("\u0639\u0628\u062F\u0627\u0644", "abd al ")
             .replace("\u0639\u0628\u062F \u0627\u0644", "abd al ")
             .replace("\u0639\u0628\u062F", "abd ")
             .replace("\u0627\u0628\u0648 ", "abu ")
             .replace("\u0628\u0646 ", "bin ")
             .replace("\u0627\u0628\u0646 ", "ibn ");

        // "ال" بس لو في بداية كلمة (بعد مسافة أو بداية النص)
        // مش داخل الكلمة مثل "صالح" أو "خالد"
        s = s.replaceAll("(^|\\s)\u0627\u0644", "$1al ");

        Map<String, String> map = new LinkedHashMap<>();
        map.put("\u0634", "sh"); map.put("\u062e", "kh"); map.put("\u063a", "gh");
        map.put("\u062b", "th"); map.put("\u0630", "dh"); map.put("\u0638", "dh");
        map.put("\u0635", "s");  map.put("\u0636", "d");  map.put("\u0637", "t");
        map.put("\u0639", "a");  map.put("\u062d", "h");  map.put("\u0642", "q");
        map.put("\u0627", "a");  map.put("\u0628", "b");  map.put("\u062a", "t");
        map.put("\u062c", "j");  map.put("\u062f", "d");  map.put("\u0631", "r");
        map.put("\u0632", "z");  map.put("\u0633", "s");  map.put("\u0641", "f");
        map.put("\u0643", "k");  map.put("\u0644", "l");  map.put("\u0645", "m");
        map.put("\u0646", "n");  map.put("\u0647", "h");  map.put("\u0648", "ou");
        map.put("\u064a", "y");  map.put("\u0621", "");   map.put("\u0626", "y");
        map.put("\u0624", "w");

        for (Map.Entry<String, String> e : map.entrySet())
            s = s.replace(e.getKey(), e.getValue());

        return s.replaceAll("[^a-zA-Z\\s]", "").replaceAll("\\s+", " ").trim();
    }

    // ══════════════════════════════════════════
    //  LEVENSHTEIN
    // ══════════════════════════════════════════
    public static double levenshteinSimilarity(String a, String b) {
        if (a == null || b == null) return 0.0;
        if (a.equals(b)) return 100.0;
        int maxLen = Math.max(a.length(), b.length());
        if (maxLen == 0) return 100.0;
        return Math.max(0.0, (1.0 - (double) levenshtein(a, b) / maxLen) * 100);
    }

    private static int levenshtein(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];
        for (int i = 0; i <= a.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= b.length(); j++) dp[0][j] = j;
        for (int i = 1; i <= a.length(); i++)
            for (int j = 1; j <= b.length(); j++)
                dp[i][j] = a.charAt(i-1) == b.charAt(j-1) ? dp[i-1][j-1]
                          : 1 + Math.min(dp[i-1][j-1], Math.min(dp[i-1][j], dp[i][j-1]));
        return dp[a.length()][b.length()];
    }

    public static boolean isArabic(String s) {
        return s != null && s.chars().anyMatch(c -> c >= 0x0600 && c <= 0x06FF);
    }
}