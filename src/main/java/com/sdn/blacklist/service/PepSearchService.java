package com.sdn.blacklist.service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.sdn.blacklist.common.dto.SanctionSearchResult;
import com.sdn.blacklist.common.util.SmartNameMatcher;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class PepSearchService {

    private static final String WIKIDATA_ENDPOINT = "https://www.wikidata.org/w/api.php";
    private static final ObjectMapper MAPPER = new ObjectMapper();

    // ══════════════════════════════════════════
    //  Cache — 10,000 اسم، 24 ساعة
    //  ✅ رفعنا الحجم والمدة لتقليل Wikidata calls
    // ══════════════════════════════════════════
    private static final Cache<String, List<SanctionSearchResult>> PEP_CACHE =
        Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterWrite(Duration.ofHours(24))
            .build();

    // ══════════════════════════════════════════
    //  "لا نتائج" Cache — يمنع إعادة البحث عن أسماء فاشلة
    //  ✅ أهم تحسين للسرعة — بدل ما يروح Wikidata كل مرة
    // ══════════════════════════════════════════
    private static final Cache<String, Boolean> NO_RESULT_CACHE =
        Caffeine.newBuilder()
            .maximumSize(20_000)
            .expireAfterWrite(Duration.ofHours(6))
            .build();

    // ══════════════════════════════════════════
    //  Thread Pool — 2 threads بدل 4
    //  ✅ نقلّل الضغط على الـ network
    // ══════════════════════════════════════════
    private static final ExecutorService PEP_EXECUTOR =
        Executors.newFixedThreadPool(2);

    private final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofMillis(800))  // ✅ 0.8s بدل 3s
        .build();

    // ══════════════════════════════════════════
    //  Entry Point
    // ══════════════════════════════════════════
    public List<SanctionSearchResult> searchPep(String name, double threshold) {
        String cacheKey = normalize(name);

        // ✅ Cache hit → رجّع فوراً بدون أي network call
        List<SanctionSearchResult> cached = PEP_CACHE.getIfPresent(cacheKey);
        if (cached != null) {
            log.debug("✅ PEP cache hit: {}", name);
            return cached;
        }

        // ✅ "لا نتائج" cache hit → رجّع فاضي فوراً
        if (Boolean.TRUE.equals(NO_RESULT_CACHE.getIfPresent(cacheKey))) {
            log.debug("⚡ PEP no-result cache hit: {}", name);
            return List.of();
        }

        // ✅ بحث واحد فقط بدل phase1 + phase2
        // phase2 (fallback) كان يأخذ 1.5s إضافية — شلناه
        Map<String, SanctionSearchResult> seen = new ConcurrentHashMap<>();
        boolean isArabic = SmartNameMatcher.isArabic(name);

        try {
            String primaryQuery = normalize(name);

            // ✅ بحث إنجليزي فقط — أسرع وأدق
            // العربي: نترجمه بالـ transliterate ونبحث إنجليزي
            String searchQuery = isArabic
                ? SmartNameMatcher.transliterate(primaryQuery)
                : primaryQuery;

            searchByLanguage(searchQuery, "en", threshold, seen, name, isArabic);

            // لو ما لاقى شي بالإنجليزي، جرّب عربي
            if (seen.isEmpty() && isArabic) {
                searchByLanguage(primaryQuery, "ar", threshold, seen, name, isArabic);
            }

        } catch (Exception e) {
            log.debug("⚠️ PEP search error for '{}': {}", name, e.getMessage());
        }

        List<SanctionSearchResult> results = new ArrayList<>(seen.values());
        results.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));

        // ✅ Cache النتيجة — سواء فيها شي أو فاضية
        if (!results.isEmpty()) {
            PEP_CACHE.put(cacheKey, results);
        } else {
            // خزّن "لا نتائج" عشان ما نرجع نبحث
            NO_RESULT_CACHE.put(cacheKey, Boolean.TRUE);
        }

        return results;
    }

    // ══════════════════════════════════════════
    //  Search via Wikidata — timeout 800ms
    // ══════════════════════════════════════════
    private void searchByLanguage(String query, String lang, double threshold,
                                   Map<String, SanctionSearchResult> seen,
                                   String originalName, boolean isArabic) {
        try {
            String url = WIKIDATA_ENDPOINT
                + "?action=wbsearchentities"
                + "&search=" + URLEncoder.encode(query, StandardCharsets.UTF_8)
                + "&language=" + lang
                + "&uselang=en"           // ✅ دايماً نجيب الـ description بالإنجليزي
                + "&type=item&limit=5"    // ✅ 5 بدل 10 — أسرع
                + "&format=json";

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("User-Agent", "RiskLens/1.0")
                .timeout(Duration.ofMillis(800))  // ✅ 800ms بدل 1500ms
                .GET().build();

            HttpResponse<String> response = httpClient.send(
                request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) return;

            JsonNode search = MAPPER.readTree(response.body()).path("search");
            String normOriginal = normalize(originalName);
            String translitOriginal = isArabic
                ? SmartNameMatcher.transliterate(normOriginal)
                : normOriginal;

            for (JsonNode item : search) {
                String label       = item.path("label").asText("").trim();
                String description = item.path("description").asText("").toLowerCase().trim();
                String wikidataId  = item.path("id").asText("").trim();
                String aliasMatch  = item.path("match").path("text").asText("").trim();

                if (label.isBlank() || seen.containsKey(wikidataId)) continue;
                if (isNonPerson(description)) continue;
                if (!isPepDescription(description)) continue; // ✅ مطلوب دايماً

                String normLabel = normalize(label);
                String normAlias = normalize(aliasMatch);

                // ── حساب التشابه ──
                double sim = SmartNameMatcher.match(normOriginal, normLabel);

                if (!normAlias.isBlank())
                    sim = Math.max(sim, SmartNameMatcher.match(normOriginal, normAlias));

                // Cross-language للعربي
                if (isArabic) {
                    sim = Math.max(sim, SmartNameMatcher.match(translitOriginal, normLabel));
                    sim = Math.max(sim, SmartNameMatcher.crossLanguageSimilarity(normOriginal, normLabel));
                }

                // Partial match للأسماء الطويلة
                sim = Math.max(sim, partialNameMatch(normOriginal, normLabel));

                // PEP boost
                if (isPepDescription(description)) sim = Math.min(sim + 5.0, 100.0);

                double effectiveThreshold = isArabic
                    ? Math.max(threshold - 5.0, 65.0)
                    : Math.max(threshold - 5.0, 75.0);

                if (sim >= effectiveThreshold) {
                    String notes = description.isBlank()
                        ? "Politically Exposed Person"
                        : capitalize(description);

                    log.info("✅ PEP: {} [{}] sim={:.1f}% — {}", label, wikidataId, sim, notes);

                    seen.put(wikidataId, SanctionSearchResult.builder()
                        .id(UUID.nameUUIDFromBytes(wikidataId.getBytes()))
                        .name(label)
                        .score(sim)
                        .source("PEP")
                        .nameSimilarity(sim)
                        .aliasSimilarity(0.0)
                        .notes(notes)
                        .wikidataId(wikidataId)
                        .build());
                }
            }

        } catch (Exception e) {
            log.debug("PEP error [lang={}, q={}]: {}", lang, query, e.getMessage());
        }
    }

    // ══════════════════════════════════════════
    //  Partial Name Match
    // ══════════════════════════════════════════
    private double partialNameMatch(String query, String label) {
        String[] qWords = query.split("\\s+");
        String[] lWords = label.split("\\s+");
        if (qWords.length <= 1) return 0;

        long matched = 0;
        for (String qw : qWords) {
            if (qw.length() < 3) continue;
            for (String lw : lWords) {
                if (lw.length() < 3) continue;
                if (SmartNameMatcher.levenshteinSimilarity(qw, lw) >= 85.0) {
                    matched++;
                    break;
                }
            }
        }

        long significant = Arrays.stream(qWords).filter(w -> w.length() >= 3).count();
        if (significant == 0) return 0;

        double rate = (double) matched / significant;
        if (rate >= 0.85) return 82.0;
        if (rate >= 0.70) return 72.0;
        return 0;
    }

    // ══════════════════════════════════════════
    //  Helpers
    // ══════════════════════════════════════════
    private boolean isNonPerson(String d) {
        if (d.isBlank()) return false;
        for (String k : new String[]{
            "village","town","city","district","province","municipality",
            "region","road","mosque","church","hospital","school","university",
            "stadium","park","airport","company","corporation","foundation",
            "organization","institute","center","centre",
            "مسجد","قرية","مدينة","محافظة","منطقة","مؤسسة","مركز","شركة"
        }) if (d.contains(k)) return true;
        return false;
    }

    private boolean isPepDescription(String d) {
        if (d.isBlank()) return false;
        for (String k : new String[]{
            "president","prime minister","minister","senator","politician",
            "governor","mayor","ambassador","diplomat","chancellor",
            "king","queen","prince","emir","sheikh","general","admiral",
            "judge","parliament","head of state","officer","statesman",
            "oligarch","crown prince","director general","official",
            "ضابط","قائد","رئيس وزراء","رئيس","وزير","سفير","حاكم",
            "أمير","شيخ","جنرال","قاضي","نائب","برلماني","سياسي",
            "ولي عهد","ملك"
        }) if (d.contains(k)) return true;
        return false;
    }

    private String normalize(String name) {
        if (name == null) return "";
        return name.toLowerCase()
            .replaceAll("[-_.'`]", " ")
            .replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا')
            .replace('ة', 'ه').replace('ى', 'ي')
            .replace('ؤ', 'و').replace('ئ', 'ي')
            .replaceAll("[\\u064B-\\u065F\\u0670]", "")
            .replaceAll("\\s+", " ").trim();
    }

    private String capitalize(String s) {
        if (s == null || s.isBlank()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    public void clearCache() {
        PEP_CACHE.invalidateAll();
        NO_RESULT_CACHE.invalidateAll();
    }

    public long getCacheSize()         { return PEP_CACHE.estimatedSize(); }
    public long getNoResultCacheSize() { return NO_RESULT_CACHE.estimatedSize(); }
}