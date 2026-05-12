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
import java.util.concurrent.CompletableFuture;
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

/**
 * PepSearchService — بحث PEP عبر Wikidata
 *
 * التحسينات:
 *  - Caffeine Cache بدل ConcurrentHashMap (حد 5000، انتهاء 12 ساعة)
 *  - ExecutorService خاص بـ PEP (4 threads) بدل ForkJoinPool العام
 *  - Query واحد أساسي + fallback فقط إذا ما في نتائج
 *  - Timeout 1.5 ثانية بدل 4 ثوان
 *  - دقة أعلى: aliases + cross-language + phonetic
 */
@Slf4j
@Service
public class PepSearchService {

    private static final String WIKIDATA_ENDPOINT = "https://www.wikidata.org/w/api.php";
    private static final ObjectMapper MAPPER = new ObjectMapper();

    // ══════════════════════════════════════════
    //  Caffeine Cache — حد 5000 اسم، 12 ساعة
    // ══════════════════════════════════════════
    private static final Cache<String, List<SanctionSearchResult>> PEP_CACHE =
        Caffeine.newBuilder()
            .maximumSize(5_000)
            .expireAfterWrite(Duration.ofHours(12))
            .build();

    // ══════════════════════════════════════════
    //  Thread Pool خاص بـ PEP (4 threads)
    // ══════════════════════════════════════════
    private static final ExecutorService PEP_EXECUTOR =
        Executors.newFixedThreadPool(4);

    private final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(3))
        .build();

    // ══════════════════════════════════════════
    //  Entry Point
    // ══════════════════════════════════════════
    public List<SanctionSearchResult> searchPep(String name, double threshold) {
        String cacheKey = normalize(name);

        // Cache hit → رجّع فوراً
        List<SanctionSearchResult> cached = PEP_CACHE.getIfPresent(cacheKey);
        if (cached != null) {
            log.debug("✅ PEP cache hit: {}", name);
            return cached;
        }

        Map<String, SanctionSearchResult> seen = new ConcurrentHashMap<>();
        boolean isArabic = isArabic(name);

        // ── المرحلة الأولى: Query الأساسي (الاسم الكامل) ──────────────────
        List<CompletableFuture<Void>> phase1 = new ArrayList<>();
        String primaryQuery = normalize(name);

        phase1.add(CompletableFuture.runAsync(() ->
            searchByLanguage(primaryQuery, "en", threshold, seen, name, isArabic),
            PEP_EXECUTOR));

        if (isArabic) {
            phase1.add(CompletableFuture.runAsync(() ->
                searchByLanguage(primaryQuery, "ar", threshold, seen, name, isArabic),
                PEP_EXECUTOR));
        }

        try {
            CompletableFuture.allOf(phase1.toArray(new CompletableFuture[0]))
                .get(1500, TimeUnit.MILLISECONDS);
        } catch (Exception e) {
            log.warn("⚠️ PEP phase1 timeout for '{}'", name);
        }

        // ── المرحلة الثانية: Fallback queries (فقط إذا ما في نتائج) ────────
        if (seen.isEmpty()) {
            List<String> fallbackQueries = buildFallbackQueries(name, isArabic);
            List<CompletableFuture<Void>> phase2 = new ArrayList<>();

            for (String q : fallbackQueries) {
                phase2.add(CompletableFuture.runAsync(() ->
                    searchByLanguage(q, "en", threshold, seen, name, isArabic),
                    PEP_EXECUTOR));
                if (isArabic) {
                    phase2.add(CompletableFuture.runAsync(() ->
                        searchByLanguage(q, "ar", threshold, seen, name, isArabic),
                        PEP_EXECUTOR));
                }
            }

            try {
                CompletableFuture.allOf(phase2.toArray(new CompletableFuture[0]))
                    .get(1500, TimeUnit.MILLISECONDS);
            } catch (Exception e) {
                log.warn("⚠️ PEP phase2 timeout for '{}'", name);
            }
        }

        List<SanctionSearchResult> results = new ArrayList<>(seen.values());
        results.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));

        PEP_CACHE.put(cacheKey, results);
        return results;
    }

    // ══════════════════════════════════════════
    //  Fallback Queries — بس إذا ما في نتائج
    // ══════════════════════════════════════════
    private List<String> buildFallbackQueries(String name, boolean isArabic) {
        List<String> queries = new ArrayList<>();
        String normalized = normalize(name);
        String[] parts = normalized.split("\\s+");

        // أول + آخر كلمة
        if (parts.length >= 3) {
            queries.add(parts[0] + " " + parts[parts.length - 1]);
        }
        // آخر كلمتين
        if (parts.length >= 2) {
            queries.add(parts[parts.length - 2] + " " + parts[parts.length - 1]);
        }
        // بدون "ال" للعربي
        if (isArabic) {
            String withoutAl = normalized
                .replaceAll("ال([^ ])", "$1")
                .replaceAll("\\s+", " ").trim();
            if (!withoutAl.equals(normalized))
                queries.add(withoutAl);
        }

        return queries;
    }

    // ══════════════════════════════════════════
    //  Search via Wikidata
    // ══════════════════════════════════════════
    private void searchByLanguage(String query, String lang, double threshold,
                                   Map<String, SanctionSearchResult> seen,
                                   String originalName, boolean isArabic) {
        try {
            String url = WIKIDATA_ENDPOINT
                + "?action=wbsearchentities"
                + "&search=" + URLEncoder.encode(query, StandardCharsets.UTF_8)
                + "&language=" + lang
                + "&uselang=" + lang
                + "&type=item&limit=10&format=json";

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("User-Agent", "RiskLens/1.0")
                .timeout(Duration.ofMillis(1500))   // ← 1.5s بدل 4s
                .GET().build();

            HttpResponse<String> response = httpClient.send(
                request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) return;

            JsonNode search = MAPPER.readTree(response.body()).path("search");
            String normOriginal = normalize(originalName);

            for (JsonNode item : search) {
                String label       = item.path("label").asText("").trim();
                String description = item.path("description").asText("").toLowerCase().trim();
                String wikidataId  = item.path("id").asText("").trim();
                String aliasMatch  = item.path("match").path("text").asText("").trim();

                if (label.isBlank() || seen.containsKey(wikidataId)) continue;

                // رفض الأماكن والكيانات غير الأشخاص
                if (isNonPerson(description)) continue;

                // للإنجليزي — لازم يكون PEP keyword
                // للعربي — تساهل إذا description فارغ
                if (!isArabic && !isPepDescription(description)) continue;
                if (isArabic && !description.isBlank() && !isPepDescription(description)) continue;

                // ── حساب التشابه ──────────────────────────────────────────
                String normLabel = normalize(label);
                String normAlias = normalize(aliasMatch);

                // 1. مطابقة الاسم الأساسي
                double sim = SmartNameMatcher.match(normOriginal, normLabel);

                // 2. مطابقة الـ alias
                if (!normAlias.isBlank()) {
                    sim = Math.max(sim, SmartNameMatcher.match(normOriginal, normAlias));
                }

                // 3. Partial match (مهم للأسماء الطويلة)
                sim = Math.max(sim, partialNameMatch(normOriginal, normLabel));
                if (!normAlias.isBlank()) {
                    sim = Math.max(sim, partialNameMatch(normOriginal, normAlias));
                }

                // 4. Phonetic — للأسماء المركبة
                if (label.contains(" ")) {
                    sim = Math.max(sim, SmartNameMatcher.phoneticSimilarity(normOriginal, normLabel));
                }

                // 5. Cross-language — عربي ↔ إنجليزي
                sim = Math.max(sim, SmartNameMatcher.crossLanguageSimilarity(normOriginal, normLabel));
                if (!normAlias.isBlank()) {
                    sim = Math.max(sim, SmartNameMatcher.crossLanguageSimilarity(normOriginal, normAlias));
                }

                // 6. PEP boost
                if (isPepDescription(description)) sim = Math.min(sim + 5.0, 100.0);

                // Threshold — أخف للعربي
                double effectiveThreshold = isArabic
                    ? Math.max(threshold - 5.0, 65.0)
                    : Math.max(threshold - 5.0, 78.0);

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
    //  مهم للأسماء الطويلة: "محمد بن سلمان" vs "محمد سلمان آل سعود"
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
                if (SmartNameMatcher.match(qw, lw) >= 85.0) {
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
    //  isNonPerson
    // ══════════════════════════════════════════
    private boolean isNonPerson(String d) {
        if (d.isBlank()) return false;
        for (String k : new String[]{
            "village","town","city","district","province","municipality",
            "region","road","mosque","church","temple","hospital","school",
            "university","stadium","park","airport","company","corporation",
            "foundation","organization","institute","center","centre",
            "مسجد","قرية","مدينة","محافظة","منطقة","مؤسسة","مركز","شركة"
        }) if (d.contains(k)) return true;
        return false;
    }

    // ══════════════════════════════════════════
    //  isPepDescription
    // ══════════════════════════════════════════
    private boolean isPepDescription(String d) {
        if (d.isBlank()) return false;
        for (String k : new String[]{
            "president","prime minister","minister","senator","politician",
            "governor","mayor","ambassador","diplomat","chancellor",
            "king","queen","prince","emir","sheikh","general","admiral",
            "judge","parliament","head of state","head of government","officer",
            "statesman","oligarch","crown prince","director general",
            "ضابط","قائد","رئيس وزراء","رئيس","وزير","سفير","حاكم",
            "أمير","شيخ","جنرال","قاضي","نائب","برلماني","سياسي",
            "ولي عهد","ملك","أميرة"
        }) if (d.contains(k)) return true;
        return false;
    }

    // ══════════════════════════════════════════
    //  Normalize — موحّد للعربي والإنجليزي
    // ══════════════════════════════════════════
    private String normalize(String name) {
        if (name == null) return "";
        return name.toLowerCase()
            .replaceAll("[-_.'`]", " ")
            .replace('أ', 'ا')
            .replace('إ', 'ا')
            .replace('آ', 'ا')
            .replace('ة', 'ه')
            .replace('ى', 'ي')
            .replace('ؤ', 'و')
            .replace('ئ', 'ي')
            .replaceAll("[\\u064B-\\u065F\\u0670]", "") // حذف التشكيل
            .replaceAll("\\s+", " ")
            .trim();
    }

    private boolean isArabic(String s) {
        return s != null && s.chars().anyMatch(c -> c >= 0x0600 && c <= 0x06FF);
    }

    private String capitalize(String s) {
        if (s == null || s.isBlank()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    // ══════════════════════════════════════════
    //  Cache Management
    // ══════════════════════════════════════════
    public void clearCache() { PEP_CACHE.invalidateAll(); }
    public long getCacheSize() { return PEP_CACHE.estimatedSize(); }
}