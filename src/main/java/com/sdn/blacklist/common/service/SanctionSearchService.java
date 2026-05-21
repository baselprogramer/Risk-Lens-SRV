package com.sdn.blacklist.common.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;

import com.sdn.blacklist.common.dto.SanctionSearchResult;
import com.sdn.blacklist.common.repository.SanctionSearchRepository;
import com.sdn.blacklist.common.util.NameTranslator;
import com.sdn.blacklist.common.util.PhoneticUtil;
import com.sdn.blacklist.common.util.SmartNameMatcher;
import com.sdn.blacklist.local.repository.LocalSanctionRepository;
import com.sdn.blacklist.repository.SanctionRepository;
import com.sdn.blacklist.search.SanctionSearchDocument;
import com.sdn.blacklist.search.SearchRepository;
import com.sdn.blacklist.service.PepSearchService;

import co.elastic.clients.elasticsearch._types.query_dsl.TextQueryType;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class SanctionSearchService {

    private static final double RAW_SCORE_CAP = 150.0;

    private final SanctionSearchRepository repository;
    private final LocalSanctionRepository  localRepository;
    private final SanctionRepository       ofacRepository;
    private final SearchRepository         searchRepository;
    private final ElasticsearchOperations  elasticsearchOperations;
    private final PepSearchService         pepSearchService;

    public SanctionSearchService(
        SanctionSearchRepository repository,
        LocalSanctionRepository  localRepository,
        SanctionRepository       ofacRepository,
        SearchRepository         searchRepository,
        ElasticsearchOperations  elasticsearchOperations,
        PepSearchService         pepSearchService) {
        this.repository              = repository;
        this.localRepository         = localRepository;
        this.ofacRepository          = ofacRepository;
        this.searchRepository        = searchRepository;
        this.elasticsearchOperations = elasticsearchOperations;
        this.pepSearchService        = pepSearchService;
    }

    public List<SanctionSearchResult> search(String query, double threshold, int page, int size) {

        if (query == null || query.isBlank()) return List.of();

        // normalize مرة وحدة — SmartNameMatcher هو الـ single source of truth
        final String normalizedQuery = SmartNameMatcher.normalize(query);
        final boolean isArabicQuery  = SmartNameMatcher.isArabic(normalizedQuery);

        // translated + phonetic للـ ES query فقط
        final String translatedQuery = isArabicQuery
            ? NameTranslator.translateName(normalizedQuery)
            : normalizedQuery;

        final String phoneticQuery = PhoneticUtil.encodeFullName(
            isArabicQuery ? translatedQuery : normalizedQuery);

        log.debug("🔍 Query='{}' | Translated='{}' | Phonetic='{}'",
            normalizedQuery, translatedQuery, phoneticQuery);

        // ══════════════════════════════════════════
        //  ELASTICSEARCH QUERY
        //  الهدف: net wide — نسترجع كل المرشحين المحتملين
        //  SmartNameMatcher هو الحكم الحقيقي بعدين
        // ══════════════════════════════════════════
        NativeQuery nativeQuery = NativeQuery.builder()
            .withQuery(q -> q.bool(b -> {

                // ── Name: تطابق كامل ──
                b.should(s -> s.matchPhrase(m -> m
                    .field("name").query(normalizedQuery).boost(8.0f)));

                // ── Name: fuzzy كامل ──
                b.should(s -> s.match(m -> m
                    .field("name").query(normalizedQuery)
                    .fuzziness("AUTO").prefixLength(2)
                    .minimumShouldMatch("75%").boost(6.0f)));

                // ── Name: prefix match — يلتقط الاسم الناقص من الآخر ──
                b.should(s -> s.matchPhrasePrefix(m -> m
                    .field("name").query(normalizedQuery).boost(5.0f)));

                // ── Name: fuzzy جزئي — threshold أقل للشركات والأسماء الطويلة ──
                b.should(s -> s.match(m -> m
                    .field("name").query(normalizedQuery)
                    .fuzziness("AUTO").prefixLength(1)
                    .minimumShouldMatch("55%").boost(4.0f)));

                // ── Aliases ──
                b.should(s -> s.matchPhrase(m -> m
                    .field("aliases").query(normalizedQuery).boost(5.0f)));
                b.should(s -> s.match(m -> m
                    .field("aliases").query(normalizedQuery)
                    .fuzziness("AUTO").prefixLength(1)
                    .minimumShouldMatch("50%").boost(3.0f)));

                // ── Phonetic ──
                b.should(s -> s.match(m -> m
                    .field("phoneticName").query(phoneticQuery).boost(2.0f)));

                // ── translatedName ──
                b.should(s -> s.match(m -> m
                    .field("translatedName").query(normalizedQuery)
                    .fuzziness("AUTO").minimumShouldMatch("55%").boost(5.0f)));

                // ── Cross-fields ──
                b.should(s -> s.multiMatch(m -> m
                    .fields("name", "aliases", "translatedName")
                    .query(normalizedQuery)
                    .type(TextQueryType.CrossFields)
                    .minimumShouldMatch("2")
                    .boost(5.0f)));

                // ── Arabic query → queries إضافية بالإنجليزي ──
                if (isArabicQuery && !translatedQuery.equals(normalizedQuery)) {
                    b.should(s -> s.matchPhrase(m -> m
                        .field("name").query(translatedQuery).boost(7.0f)));
                    b.should(s -> s.match(m -> m
                        .field("name").query(translatedQuery)
                        .fuzziness("AUTO").prefixLength(2)
                        .minimumShouldMatch("55%").boost(5.0f)));
                    b.should(s -> s.matchPhrasePrefix(m -> m
                        .field("name").query(translatedQuery).boost(4.0f)));
                    b.should(s -> s.match(m -> m
                        .field("aliases").query(translatedQuery)
                        .fuzziness("AUTO").minimumShouldMatch("50%").boost(3.0f)));
                    b.should(s -> s.match(m -> m
                        .field("phoneticName").query(phoneticQuery).boost(2.5f)));
                    b.should(s -> s.match(m -> m
                        .field("translatedName").query(translatedQuery)
                        .fuzziness("AUTO").minimumShouldMatch("55%").boost(5.0f)));
                }

                b.minimumShouldMatch("1");
                return b;
            }))
            .withPageable(PageRequest.of(page, Math.max(size, 50)))
            .build();

        List<SanctionSearchResult> results = new ArrayList<>();

        // ══════════════════════════════════════════
        //  PROCESS ES HITS
        // ══════════════════════════════════════════
        try {
            SearchHits<SanctionSearchDocument> hits =
                elasticsearchOperations.search(nativeQuery, SanctionSearchDocument.class);

            log.debug("📊 ES hits: {}", hits.getTotalHits());

            hits.stream().map(hit -> {
                SanctionSearchDocument doc      = hit.getContent();
                String                 docName  = doc.getName()           != null ? doc.getName()           : "";
                String                 docTransl= doc.getTranslatedName() != null ? doc.getTranslatedName() : "";

                // ✅ parse الـ aliases — بيستخرج النص الحقيقي من JSON strings
                // مثال: "{\"lastName\":\"AL-ASAD\"}" → "AL-ASAD"
                List<String> docAlias = parseAliases(doc.getAliases());

                // ── nameSim: مقارنة الاسم الرئيسي ──
                double nameSim = SmartNameMatcher.match(normalizedQuery, docName, docAlias);

                if (!isArabicQuery && !docTransl.isBlank()) {
                    nameSim = Math.max(nameSim,
                        SmartNameMatcher.match(normalizedQuery, docTransl, docAlias));
                }
                if (isArabicQuery) {
                    nameSim = Math.max(nameSim,
                        SmartNameMatcher.match(normalizedQuery, docTransl, docAlias));
                }
                nameSim = Math.min(nameSim, 100.0);

                // ── aliasSim: مقارنة الـ aliases المـ parsed مباشرة ──
                double aliasSim = docAlias.stream()
                    .mapToDouble(alias -> SmartNameMatcher.match(normalizedQuery, alias))
                    .max().orElse(0.0);
                aliasSim = Math.min(aliasSim * 0.88, 100.0);

                double finalSim = Math.max(nameSim, aliasSim);

                UUID id;
                try {
                    id = UUID.fromString(doc.getId());
                } catch (Exception e) {
                    id = UUID.nameUUIDFromBytes(doc.getId().getBytes());
                }

                return new SanctionSearchResult(
                    id, doc.getName(), finalSim,
                    doc.getSource(), finalSim, aliasSim
                );
            })
            .filter(r -> r.getNameSimilarity() >= threshold)
            .forEach(results::add);

        } catch (Exception e) {
            log.error("❌ ES Error: {}", e.getMessage());
        }

        // ── PEP ──
        try {
            double pepThreshold = Math.min(threshold, 75.0);
            List<SanctionSearchResult> pepResults =
                pepSearchService.searchPep(normalizedQuery, pepThreshold);
            if (!pepResults.isEmpty()) {
                log.info("✅ PEP matches: {} for '{}'", pepResults.size(), normalizedQuery);
                results.addAll(pepResults);
            }
        } catch (Exception e) {
            log.warn("⚠️ PEP search skipped: {}", e.getMessage());
        }

        // ── Dedup + Sort ──
        List<SanctionSearchResult> deduped = results.stream()
            .collect(java.util.stream.Collectors.collectingAndThen(
                java.util.stream.Collectors.toMap(
                    r -> r.getSource() + "|" +
                         (r.getId() != null ? r.getId().toString()
                                            : r.getName().toLowerCase().trim()),
                    r -> r,
                    (a, b) -> a.getScore() >= b.getScore() ? a : b,
                    java.util.LinkedHashMap::new
                ),
                m -> new ArrayList<>(m.values())
            ));

        deduped.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));
        return deduped;
    }

    public Object getDetails(UUID id, String source) {
        if (source != null && source.contains("|")) {
            List<Object> details = new ArrayList<>();
            for (String s : source.split("\\|")) {
                Object d = getSingleDetail(id, s.trim());
                if (d != null) details.add(d);
            }
            return details.isEmpty() ? null : details;
        }
        return getSingleDetail(id, source);
    }

    private Object getSingleDetail(UUID id, String source) {
        if ("LOCAL".equalsIgnoreCase(source))
            return localRepository.findById(id).orElse(null);
        if ("OFAC".equalsIgnoreCase(source)       || "EU".equalsIgnoreCase(source)
            || "UN".equalsIgnoreCase(source)       || "UK".equalsIgnoreCase(source)
            || "INTERPOL".equalsIgnoreCase(source) || "WORLD_BANK".equalsIgnoreCase(source))
            return ofacRepository.findById(id).orElse(null);
        return null;
    }

    // ══════════════════════════════════════════
    //  parseAliases
    //  يستخرج الأسماء الحقيقية من الـ aliases
    //  سواء كانت JSON strings أو plain text
    //
    //  مثال JSON:
    //  "{\"lastName\":\"AL-ASAD\"}"  → "AL-ASAD"
    //  "{\"firstName\":\"Bashar\",\"lastName\":\"AL-ASAD\"}" → "Bashar AL-ASAD"
    //
    //  مثال plain:
    //  "AL ASSAD" → "AL ASSAD"
    // ══════════════════════════════════════════
    private List<String> parseAliases(List<String> rawAliases) {
        if (rawAliases == null || rawAliases.isEmpty()) return List.of();

        List<String> parsed = new ArrayList<>();
        for (String raw : rawAliases) {
            if (raw == null || raw.isBlank()) continue;

            String trimmed = raw.trim();

            // JSON string؟
            if (trimmed.startsWith("{")) {
                // استخرج firstName و lastName و wholeName
                String firstName = extractJsonField(trimmed, "firstName");
                String lastName  = extractJsonField(trimmed, "lastName");
                String wholeName = extractJsonField(trimmed, "wholeName");

                if (wholeName != null && !wholeName.isBlank()) {
                    parsed.add(wholeName.trim());
                } else {
                    // ادمج firstName + lastName
                    StringBuilder name = new StringBuilder();
                    if (firstName != null && !firstName.isBlank()) name.append(firstName.trim());
                    if (lastName  != null && !lastName.isBlank()) {
                        if (name.length() > 0) name.append(" ");
                        name.append(lastName.trim());
                    }
                    if (name.length() > 0) parsed.add(name.toString());
                }
            } else {
                // plain text alias
                parsed.add(trimmed);
            }
        }
        return parsed;
    }

    /** يستخرج قيمة field من JSON string بدون library خارجية */
    private String extractJsonField(String json, String field) {
        String key = "\"" + field + "\":\"";
        int start  = json.indexOf(key);
        if (start < 0) return null;
        start += key.length();
        int end = json.indexOf("\"", start);
        if (end < 0) return null;
        return json.substring(start, end);
    }
}