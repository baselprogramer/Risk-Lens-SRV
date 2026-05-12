package com.sdn.blacklist.common.util;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.apache.commons.codec.language.DoubleMetaphone;

public class SmartNameMatcher {

    private static final DoubleMetaphone DM = new DoubleMetaphone();

    // ══════════════════════════════════════════
    //  MAIN
    // ══════════════════════════════════════════
    public static double match(String query, String candidate) {
        if (query == null || candidate == null) return 0.0;

        String q = normalize(query);
        String c = normalize(candidate);

        if (q.isEmpty() || c.isEmpty()) return 0.0;
        if (q.equals(c)) return 100.0;

        // F1 هو الحكم الأساسي
        double f1    = f1Score(q, c);
        double phon  = phoneticSimilarity(q, c);
        double cross = crossLanguageSimilarity(q, c);

        //  أحسن نتيجة من الثلاثة — مش levenshtein على الاسم كامل
        double score = Math.max(f1, Math.max(phon, cross));

        return Math.min(score, 100.0);
    }

    public static double matchBest(String query, List<String> candidates) {
        if (candidates == null || candidates.isEmpty()) return 0.0;
        return candidates.stream()
            .mapToDouble(c -> match(query, c))
            .max().orElse(0.0);
    }

    // ══════════════════════════════════════════
    //  F1 SCORE — الحكم الحقيقي
    //  بيحسب coverage بالاتجاهين ويوازن بينهم
    // ══════════════════════════════════════════
    private static double f1Score(String a, String b) {
        List<String> tA = tokenize(a);
        List<String> tB = tokenize(b);
        if (tA.isEmpty() || tB.isEmpty()) return 0.0;

        // coverage: كم token من A اتغطى بـ B
        double coverage  = computeCoverage(tA, tB);
        // precision: كم token من B موجود بـ A — يمنع false positives
        double precision = computeCoverage(tB, tA);

        if (coverage + precision == 0) return 0.0;

        // F1 = التوازن بين الاثنين
        double f1 = 2 * (coverage * precision) / (coverage + precision);

        // عقوبة فرق الطول
        double lengthPenalty = Math.sqrt(
            (double) Math.min(tA.size(), tB.size()) /
            (double) Math.max(tA.size(), tB.size())
        );

        return f1 * lengthPenalty * 100.0;
    }

    private static double computeCoverage(List<String> from, List<String> to) {
        if (from.isEmpty()) return 0.0;
        double matched = 0;
        for (String t : from) {
            double best = to.stream()
                .mapToDouble(c -> levenshteinSimilarity(t, c))
                .max().orElse(0.0);
            if (best >= 85.0)      matched += 1.0;  // تطابق قوي
            else if (best >= 65.0) matched += 0.5;  // تطابق جزئي
            // أقل من 65% = لا شيء
        }
        return matched / from.size();
    }

    // ══════════════════════════════════════════
    //  PHONETIC — بالاتجاهين كمان
    // ══════════════════════════════════════════
    public static double phoneticSimilarity(String a, String b) {
        List<String> tA = tokenize(a);
        List<String> tB = tokenize(b);
        if (tA.isEmpty() || tB.isEmpty()) return 0.0;

        double covAB = phoneticCoverage(tA, tB);
        double covBA = phoneticCoverage(tB, tA);

        if (covAB + covBA == 0) return 0.0;

        double f1 = 2 * (covAB * covBA) / (covAB + covBA);
        double lengthPenalty = Math.sqrt(
            (double) Math.min(tA.size(), tB.size()) /
            (double) Math.max(tA.size(), tB.size())
        );

        return f1 * lengthPenalty * 92.0;
    }

    private static double phoneticCoverage(List<String> from, List<String> to) {
        if (from.isEmpty()) return 0.0;
        int matched = 0;
        for (String ta : from) {
            String pa = DM.doubleMetaphone(ta);
            for (String tb : to) {
                String pb = DM.doubleMetaphone(tb);
                if (pa != null && !pa.isEmpty() && pa.equals(pb)) {
                    matched++;
                    break;
                }
            }
        }
        return (double) matched / from.size();
    }

    // ══════════════════════════════════════════
    //  CROSS-LANGUAGE — عربي ↔ إنجليزي
    // ══════════════════════════════════════════
    public static double crossLanguageSimilarity(String a, String b) {
        boolean aAr = isArabic(a);
        boolean bAr = isArabic(b);
        if (aAr == bAr) return 0.0;

        String arabic   = aAr ? a : b;
        String latin    = aAr ? b : a;
        String translit = arabicTransliterate(arabic);

        //  F1 + Phonetic على الاسم المترجم
        double f1   = f1Score(translit, latin);
        double phon = phoneticSimilarity(translit, latin);

        return Math.max(f1, phon) * 0.90;
    }

    // ══════════════════════════════════════════
    //  NORMALIZE
    // ══════════════════════════════════════════
    public static String normalize(String s) {
        if (s == null) return "";
        s = s.trim().toLowerCase();
        s = s.replaceAll("[\\u064B-\\u065F\\u0670]", "");
        s = s.replaceAll("[\\u0623\\u0625\\u0622\\u0671]", "\u0627");
        s = s.replaceAll("[\\u064A\\u0649\\u0626]", "\u064A");
        s = s.replaceAll("[\\u0629\\u0647]", "\u0647");
        s = s.replaceAll("[\\u0648\\u0624]", "\u0648");
        s = s.replaceAll("\\s+", " ").trim();
        return s;
    }

    // ══════════════════════════════════════════
    //  TOKENIZE
    // ══════════════════════════════════════════
    public static List<String> tokenize(String name) {
        if (name == null || name.isBlank()) return List.of();
        return Arrays.stream(name.trim().split("\\s+"))
            .map(String::toLowerCase)
            .map(t -> t.replaceAll("[^a-zA-Z\\u0600-\\u06FF]", ""))
            .filter(t -> t.length() > 1)
            .collect(Collectors.toList());
    }

    // ══════════════════════════════════════════
    //  ARABIC TRANSLITERATION
    // ══════════════════════════════════════════
    public static String arabicTransliterate(String arabic) {
        if (arabic == null || arabic.isBlank()) return "";
        String s = normalize(arabic);

        s = s.replace("\u0627\u0644", "al ")
             .replace("\u0639\u0628\u062f", "abd ")
             .replace("\u0627\u0628\u0648", "abu ")
             .replace("\u0628\u0646 ", "bin ")
             .replace("\u0628\u0646\u062a ", "bint ");

        Map<String, String> map = new LinkedHashMap<>();
        map.put("\u0634","sh"); map.put("\u062e","kh"); map.put("\u063a","gh");
        map.put("\u062b","th"); map.put("\u0630","z");  map.put("\u0638","z");
        map.put("\u0635","s");  map.put("\u0636","d");  map.put("\u0637","t");
        map.put("\u0639","a");  map.put("\u062d","h");  map.put("\u0642","q");
        map.put("\u0627","a");  map.put("\u0628","b");  map.put("\u062a","t");
        map.put("\u062c","j");  map.put("\u062f","d");  map.put("\u0631","r");
        map.put("\u0632","z");  map.put("\u0633","s");  map.put("\u0641","f");
        map.put("\u0643","k");  map.put("\u0644","l");  map.put("\u0645","m");
        map.put("\u0646","n");  map.put("\u0647","h");  map.put("\u0648","w");
        map.put("\u064a","y");  map.put("\u0621","");

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
                dp[i][j] = a.charAt(i-1) == b.charAt(j-1)
                    ? dp[i-1][j-1]
                    : 1 + Math.min(dp[i-1][j-1], Math.min(dp[i-1][j], dp[i][j-1]));
        return dp[a.length()][b.length()];
    }

    private static boolean isArabic(String s) {
        return s != null && s.chars().anyMatch(c -> c >= 0x0600 && c <= 0x06FF);
    }
}