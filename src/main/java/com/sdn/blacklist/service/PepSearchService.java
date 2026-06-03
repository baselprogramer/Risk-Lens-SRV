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
    //  ✅ Cache نتائج إيجابية — 10k اسم، 24 ساعة
    //  أهم شي: بعد أول بحث الأسماء المتكررة فورية
    // ══════════════════════════════════════════
    private static final Cache<String, List<SanctionSearchResult>> PEP_CACHE =
        Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterWrite(Duration.ofHours(24))
            .build();

    // ══════════════════════════════════════════
    //  ✅ Cache "لا نتائج" — 20k اسم، 6 ساعات
    //  يمنع الرجوع لـ Wikidata لأسماء ما وجدت
    // ══════════════════════════════════════════
    private static final Cache<String, Boolean> NO_RESULT_CACHE =
        Caffeine.newBuilder()
            .maximumSize(20_000)
            .expireAfterWrite(Duration.ofHours(6))
            .build();

    // ══════════════════════════════════════════
    //  ✅ HttpClient — timeouts مشددة
    //
    //  connectTimeout: 300ms (بدل 800ms)
    //  requestTimeout: 350ms (بدل 800ms)
    //
    //  بكمل بسرعة أو بفشل بسرعة — مش بينتظر طويل
    //  النتائج المتكررة كلها من الـ cache = فورية
    // ══════════════════════════════════════════
    private final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofMillis(300))
        .build();

    // ══════════════════════════════════════════
    //  Entry Point
    // ══════════════════════════════════════════
    public List<SanctionSearchResult> searchPep(String name, double threshold) {
        String cacheKey = normalize(name);

        // Cache hit → فوري
        List<SanctionSearchResult> cached = PEP_CACHE.getIfPresent(cacheKey);
        if (cached != null) {
            log.debug("✅ PEP cache hit: '{}'", name);
            return cached;
        }

        // No-result cache hit → فوري
        if (Boolean.TRUE.equals(NO_RESULT_CACHE.getIfPresent(cacheKey))) {
            log.debug("⚡ PEP no-result cache: '{}'", name);
            return List.of();
        }

        // ── بحث Wikidata ──────────────────────────────────────────────────────
        Map<String, SanctionSearchResult> seen = new ConcurrentHashMap<>();
        boolean isArabic = SmartNameMatcher.isArabic(name);

        try {
            // للعربي: حوّل لإنجليزي عبر transliterate (بدون network)
            String searchQuery = isArabic
                ? SmartNameMatcher.transliterate(normalize(name))
                : normalize(name);

            searchByLanguage(searchQuery, "en", threshold, seen, name, isArabic);

            // لو فشل الإنجليزي وكان عربي → جرّب مباشرة
            if (seen.isEmpty() && isArabic) {
                searchByLanguage(normalize(name), "ar", threshold, seen, name, isArabic);
            }

        } catch (Exception e) {
            log.debug("⚠️ PEP error for '{}': {}", name, e.getMessage());
        }

        List<SanctionSearchResult> results = new ArrayList<>(seen.values());
        results.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));

        // Cache النتيجة سواء فيها شي أو لا
        if (!results.isEmpty()) {
            PEP_CACHE.put(cacheKey, results);
            log.info("✅ PEP found {} for '{}'", results.size(), name);
        } else {
            NO_RESULT_CACHE.put(cacheKey, Boolean.TRUE);
        }

        return results;
    }

    // ══════════════════════════════════════════
    //  searchByLanguage — HTTP call لـ Wikidata
    //  timeout: 350ms — إما بيرد أو بنتخطاه
    // ══════════════════════════════════════════
    private void searchByLanguage(String query, String lang, double threshold,
                                   Map<String, SanctionSearchResult> seen,
                                   String originalName, boolean isArabic) {
        try {
            String url = WIKIDATA_ENDPOINT
                + "?action=wbsearchentities"
                + "&search=" + URLEncoder.encode(query, StandardCharsets.UTF_8)
                + "&language=" + lang
                + "&uselang=en"
                + "&type=item&limit=3"    // ✅ 3 بدل 5 (أسرع transfer)
                + "&format=json";

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("User-Agent", "RiskLens/1.0")
                .timeout(Duration.ofMillis(350))  // ✅ 350ms بدل 800ms
                .GET().build();

            HttpResponse<String> response = httpClient.send(
                request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) return;

            JsonNode search      = MAPPER.readTree(response.body()).path("search");
            String   normOriginal = normalize(originalName);
            String   translitOrig = isArabic
                ? SmartNameMatcher.transliterate(normOriginal) : normOriginal;

            for (JsonNode item : search) {
                String label       = item.path("label").asText("").trim();
                String description = item.path("description").asText("").toLowerCase().trim();
                String wikidataId  = item.path("id").asText("").trim();
                String aliasMatch  = item.path("match").path("text").asText("").trim();

                if (label.isBlank() || seen.containsKey(wikidataId)) continue;
                if (isNonPerson(description)) continue;
                if (!isPepDescription(description)) continue;

                String normLabel = normalize(label);
                String normAlias = normalize(aliasMatch);

                double sim = SmartNameMatcher.match(normOriginal, normLabel);
                if (!normAlias.isBlank())
                    sim = Math.max(sim, SmartNameMatcher.match(normOriginal, normAlias));

                if (isArabic) {
                    sim = Math.max(sim, SmartNameMatcher.match(translitOrig, normLabel));
                    sim = Math.max(sim,
                        SmartNameMatcher.crossLanguageSimilarity(normOriginal, normLabel));
                }

                sim = Math.max(sim, partialNameMatch(normOriginal, normLabel));
                if (isPepDescription(description)) sim = Math.min(sim + 5.0, 100.0);

                double effectiveThreshold = isArabic
                    ? Math.max(threshold - 5.0, 65.0)
                    : Math.max(threshold - 5.0, 75.0);

                if (sim >= effectiveThreshold) {
                    String notes = description.isBlank()
                        ? "Politically Exposed Person"
                        : capitalize(description);

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
            log.debug("PEP timeout/error [lang={}, q={}]: {}", lang, query, e.getMessage());
        }
    }

    // ══════════════════════════════════════════
    //  Helpers
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
                    matched++; break;
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
        log.info("🗑️ PEP cache cleared");
    }

    public long getCacheSize()         { return PEP_CACHE.estimatedSize(); }
    public long getNoResultCacheSize() { return NO_RESULT_CACHE.estimatedSize(); }
}