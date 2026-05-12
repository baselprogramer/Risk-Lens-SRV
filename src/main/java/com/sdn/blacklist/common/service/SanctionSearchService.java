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

    final String normalizedQuery = normalizeQuery(query);

    boolean isArabicQuery = normalizedQuery.chars().anyMatch(c -> c >= 0x0600 && c <= 0x06FF);

    String translatedQuery = isArabicQuery
        ? NameTranslator.translateName(normalizedQuery)
        : normalizedQuery;

    String phoneticQuery = PhoneticUtil.encodeFullName(
        isArabicQuery ? translatedQuery : normalizedQuery);

    log.debug("🔍 Query: {} | Translated: {} | Phonetic: {}",
        normalizedQuery, translatedQuery, phoneticQuery);

    NativeQuery nativeQuery = NativeQuery.builder()
        .withQuery(q -> q
            .bool(b -> {
                b.should(s -> s.matchPhrase(m -> m
                    .field("name").query(normalizedQuery).boost(6.0f)));
                b.should(s -> s.match(m -> m
                    .field("name").query(normalizedQuery)
                    .fuzziness("AUTO").prefixLength(2)
                    .minimumShouldMatch("75%").boost(6.0f)));
                b.should(s -> s.match(m -> m
                    .field("aliases").query(normalizedQuery)
                    .fuzziness("AUTO").prefixLength(1)
                    .minimumShouldMatch("50%").boost(3.0f)));
                b.should(s -> s.matchPhrase(m -> m
                    .field("aliases").query(normalizedQuery).boost(4.0f)));
                b.should(s -> s.matchPhrasePrefix(m -> m
                    .field("name").query(normalizedQuery).boost(2.0f)));
                b.should(s -> s.match(m -> m
                    .field("phoneticName").query(phoneticQuery).boost(1.5f)));
                b.should(s -> s.match(m -> m
                    .field("translatedName").query(normalizedQuery)
                    .fuzziness("AUTO").minimumShouldMatch("75%").boost(5.0f)));

                if (isArabicQuery && !translatedQuery.equals(normalizedQuery)) {
                    b.should(s -> s.matchPhrase(m -> m
                        .field("name").query(translatedQuery).boost(5.0f)));
                    b.should(s -> s.match(m -> m
                        .field("name").query(translatedQuery)
                        .fuzziness("AUTO").prefixLength(2)
                        .minimumShouldMatch("75%").boost(5.0f)));
                    b.should(s -> s.match(m -> m
                        .field("aliases").query(translatedQuery)
                        .fuzziness("AUTO").minimumShouldMatch("50%").boost(3.0f)));
                    b.should(s -> s.matchPhrase(m -> m
                        .field("aliases").query(translatedQuery).boost(4.0f)));
                    b.should(s -> s.match(m -> m
                        .field("phoneticName").query(phoneticQuery).boost(2.0f)));
                    b.should(s -> s.match(m -> m
                        .field("translatedName").query(translatedQuery)
                        .fuzziness("AUTO").minimumShouldMatch("75%").boost(5.0f)));
                }

                b.minimumShouldMatch("1");
                return b;
            })
        )
        .withPageable(PageRequest.of(page, Math.max(size, 50)))
        .build();

    List<SanctionSearchResult> results = new ArrayList<>();

    try {
        SearchHits<SanctionSearchDocument> hits =
            elasticsearchOperations.search(nativeQuery, SanctionSearchDocument.class);

        log.debug("📊 ES hits: {}", hits.getTotalHits());

        hits.stream()
            .map(hit -> {
                SanctionSearchDocument doc   = hit.getContent();
                String docName   = doc.getName()           != null ? doc.getName()           : "";
                String docTransl = doc.getTranslatedName() != null ? doc.getTranslatedName() : "";

                double esScore = Math.min((hit.getScore() / RAW_SCORE_CAP) * 100.0, 100.0);

                double nameSim = SmartNameMatcher.match(normalizedQuery, docName);
                if (!isArabicQuery && !docTransl.isBlank()) {
                    nameSim = Math.max(nameSim, SmartNameMatcher.match(normalizedQuery, docTransl));
                }
                if (isArabicQuery) {
                    nameSim = Math.max(nameSim, SmartNameMatcher.match(translatedQuery, docName));
                    nameSim = Math.max(nameSim, SmartNameMatcher.match(normalizedQuery, docTransl));
                    nameSim = Math.max(nameSim, SmartNameMatcher.match(translatedQuery, docTransl));
                }

                double aliasSim = 0.0;
                if (doc.getAliases() != null) {
                    aliasSim = doc.getAliases().stream()
                        .mapToDouble(alias -> {
                            double s = SmartNameMatcher.match(normalizedQuery, alias);
                            if (isArabicQuery) {
                                s = Math.max(s, SmartNameMatcher.match(translatedQuery, alias));
                                s = Math.max(s, SmartNameMatcher.match(normalizedQuery, docTransl));
                                s = Math.max(s, SmartNameMatcher.match(translatedQuery, docTransl));
                            }
                            return s;
                        })
                        .max().orElse(0.0);
                }

                double finalSim      = Math.max(nameSim, aliasSim);
                double combinedScore = (finalSim * 0.7) + (esScore * 0.3);

                UUID id;
                try {
                    id = UUID.fromString(doc.getId());
                } catch (Exception e) {
                    id = UUID.nameUUIDFromBytes(doc.getId().getBytes());
                }

                return new SanctionSearchResult(
                    id, doc.getName(), combinedScore,
                    doc.getSource(), finalSim, aliasSim
                );
            })
            .filter(r -> r.getNameSimilarity() >= threshold && r.getScore() >= threshold)

            .forEach(results::add);

    } catch (Exception e) {
        log.error("❌ ES Error: {}", e.getMessage());
    }

    try {
        double pepThreshold = Math.min(threshold, 75.0);
        List<SanctionSearchResult> pepResults = pepSearchService.searchPep(normalizedQuery, pepThreshold);
        if (!pepResults.isEmpty()) {
            log.info("✅ PEP matches: {} for '{}'", pepResults.size(), normalizedQuery);
            results.addAll(pepResults);
        }
    } catch (Exception e) {
        log.warn("⚠️ PEP search skipped: {}", e.getMessage());
    }

    List<SanctionSearchResult> deduped = results.stream()
        .collect(java.util.stream.Collectors.collectingAndThen(
            java.util.stream.Collectors.toMap(
                r -> r.getSource() + "|" + (r.getId() != null ? r.getId().toString() : r.getName().toLowerCase().trim()),
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
    // لو في أكثر من source (مدموجين) — ابعت كلهم
    if (source != null && source.contains("|")) {
        List<Object> details = new ArrayList<>();
        for (String s : source.split("\\|")) {
            Object detail = getSingleDetail(id, s.trim());
            if (detail != null) details.add(detail);
        }
        return details.isEmpty() ? null : details;
    }
    return getSingleDetail(id, source);
}

    private Object getSingleDetail(UUID id, String source) {
        if ("LOCAL".equalsIgnoreCase(source))
            return localRepository.findById(id).orElse(null);
        if ("OFAC".equalsIgnoreCase(source) || "EU".equalsIgnoreCase(source)
            || "UN".equalsIgnoreCase(source) || "UK".equalsIgnoreCase(source)
            || "INTERPOL".equalsIgnoreCase(source) || "WORLD_BANK".equalsIgnoreCase(source))
            return ofacRepository.findById(id).orElse(null);
        return null;
    }

private String normalizeQuery(String query) {
    if (query == null) return "";
    return query.trim()
        .replaceAll("[\\-_\\.]", " ")
        .replaceAll("(?i)\\bEl\\b", "Al")
        .replaceAll("(?i)\\bEl\\s", "Al ")
        .replaceAll("\\s+", " ")
        .trim();
}
}