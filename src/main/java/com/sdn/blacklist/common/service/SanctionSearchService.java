package com.sdn.blacklist.common.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.sdn.blacklist.common.dto.SanctionSearchResult;
import com.sdn.blacklist.common.repository.SanctionSearchRepository;
import com.sdn.blacklist.common.util.PhoneticUtil;
import com.sdn.blacklist.common.util.SmartNameMatcher;
import com.sdn.blacklist.entity.SanctionEntity;
import com.sdn.blacklist.internallist.repository.InternalListRepository;
import com.sdn.blacklist.local.repository.LocalSanctionRepository;
import com.sdn.blacklist.repository.SanctionRepository;
import com.sdn.blacklist.search.SanctionSearchDocument;
import com.sdn.blacklist.search.SearchRepository;
import com.sdn.blacklist.service.PepSearchService;
import com.sdn.blacklist.tenant.context.TenantContext;
import com.sdn.blacklist.user.entity.User;


import co.elastic.clients.elasticsearch._types.query_dsl.TextQueryType;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class SanctionSearchService {

    private static final ExecutorService VIRTUAL_EXECUTOR = Executors.newVirtualThreadPerTaskExecutor();

    private static final long DEADLINE_MS = 10000L;  // رُفعت من 3000: على الاستعلامات العريضة
                                                     // (اسم عربي شائع → آلاف المرشّحين) كان الـ ES
                                                     // ما بيلحق يخلص فتنرمى نتائجه = صفر مطابقات =
                                                     // false negative خطير بالـ AML. الرفع بيضمن
                                                     // إكمال التسجيل ورجوع النتائج (Cloudflare حدّه 100s).
    private static final long CACHE_TTL   = 5 * 60 * 1000L;
    private static final int  CACHE_MAX   = 300;

    private final Map<String, CacheEntry> searchCache = Collections
            .synchronizedMap(new LinkedHashMap<>(16, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, CacheEntry> e) {
                    return size() > CACHE_MAX;
                }
            });

    private static class CacheEntry {
        final List<SanctionSearchResult> results;
        final long ts;
        CacheEntry(List<SanctionSearchResult> r) { results = r; ts = System.currentTimeMillis(); }
        boolean valid() { return System.currentTimeMillis() - ts < CACHE_TTL; }
    }

    private final SanctionSearchRepository repository;
    private final LocalSanctionRepository  localRepository;
    private final InternalListRepository   internalRepository;
    private final SanctionRepository       ofacRepository;
    private final SearchRepository         searchRepository;
    private final ElasticsearchOperations  elasticsearchOperations;
    private final PepSearchService         pepSearchService;

    public SanctionSearchService(
            SanctionSearchRepository repository,
            LocalSanctionRepository  localRepository,
            InternalListRepository   internalRepository,
            SanctionRepository       ofacRepository,
            SearchRepository         searchRepository,
            ElasticsearchOperations  elasticsearchOperations,
            PepSearchService         pepSearchService) {
        this.repository              = repository;
        this.localRepository         = localRepository;
        this.internalRepository      = internalRepository;
        this.ofacRepository          = ofacRepository;
        this.searchRepository        = searchRepository;
        this.elasticsearchOperations = elasticsearchOperations;
        this.pepSearchService        = pepSearchService;
    }

// ══════════════════════════════════════════
    //  resolve tenant — يُقرأ على thread الطلب فقط (search/getDetails)
    //  ⚠️ مش جوّا VIRTUAL_EXECUTOR — الـ ThreadLocal ما بينتقل للـ virtual thread
    // ══════════════════════════════════════════
    private Long resolveCurrentTenantId() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof User user) {
                tenantId = user.getTenantId();
            }
        }
        return tenantId;
    }

    // ══════════════════════════════════════════
    //  WARM-UP + KEEP-ALIVE  — تثبيت السرعة
    //  المشكلة: أول query بعد خمول يكون بارد (cold) وياخد ~2.5s،
    //  فالـ deadline بيقطعو ويرجّع فاضي = false negative.
    //  الحل: نسخّن الـ ES عند الإقلاع، ونضل نحمّيه دافي كل دقيقة.
    // ══════════════════════════════════════════

    // بحث وهمي خفيف — يُشغّل نفس الـ analyzers/fields تبع البحث الحقيقي
    private void warmQuery(String term) {
        try {
            String eff       = SmartNameMatcher.normalize(term);
            String phoneticQ = PhoneticUtil.encodeFullName(eff);
            NativeQuery q    = buildQuery(eff, eff, phoneticQ, false, null, 0, 1);
            elasticsearchOperations.search(q, SanctionSearchDocument.class);
        } catch (Exception e) {
            log.debug("Warm query failed (non-fatal): {}", e.getMessage());
        }
    }

    // تسخين مسار الترجمة — أول اتصال بـ Google بياخد وقت (TLS/DNS)،
    // فنفتح الاتصال مسبقاً حتى أول اسم عربي حقيقي يلاقيه جاهز
    private void warmTranslation(String arabicTerm) {
        try {
            com.sdn.blacklist.common.util.NameTranslator.translateNameViaApi(arabicTerm);
        } catch (Exception e) {
            log.debug("Warm translation failed (non-fatal): {}", e.getMessage());
        }
    }

    // يُنفّذ مرة واحدة بعد ما يجهز التطبيق بالكامل
    @EventListener(ApplicationReadyEvent.class)
    public void warmUp() {
        VIRTUAL_EXECUTOR.submit(() -> {
            long t0 = System.currentTimeMillis();
            warmQuery("test");                 // يسخّن الـ ES
            warmTranslation("\u0645\u062d\u0645\u062f");   // يسخّن مسار الترجمة (محمد)
            log.info("🔥 ES + translation warm-up done in {}ms", System.currentTimeMillis() - t0);
        });
    }

    // ping خفيف كل 60 ثانية يمنع الـ ES + الترجمة من البرودة → السرعة تثبت
    @Scheduled(fixedDelay = 60_000L, initialDelay = 60_000L)
    public void keepAlive() {
        warmQuery("keepalive");
        warmTranslation("\u0639\u0644\u064a");   // علي — يبقي اتصال الترجمة دافي
    }

    // ══════════════════════════════════════════
    //  SEARCH
    // ══════════════════════════════════════════
    public List<SanctionSearchResult> search(String query, double threshold, int page, int size) {
        if (query == null || query.isBlank()) return List.of();

        // ⚠️ اقرأ الـ tenant هون — على thread الطلب — قبل أي عمل async
        final Long tenantId = resolveCurrentTenantId();

        // الـ tenant جزء من مفتاح الـ cache — عشان ما نخلط نتائج شركتين
        String cacheKey = query.toLowerCase().trim() + "|" + threshold + "|" + page + "|" + size
                + "|t=" + (tenantId == null ? "0" : tenantId);
        CacheEntry cached = searchCache.get(cacheKey);
        if (cached != null && cached.valid()) {
            log.debug("⚡ Cache hit: '{}'", query);
            return cached.results;
        }

        long t0 = System.currentTimeMillis();

        final String  normQ    = SmartNameMatcher.normalize(query);
        final boolean isArabic = SmartNameMatcher.isArabic(normQ);

        // رومنة الاستعلام: ScreeningService بيرومن العربي عبر Google قبل ما ينده search()
        // (بحث #1 بالاسم المرومَن، وبحث #2 بالاسم العربي لمطابقة السجلات العربية).
        // فهون منستعمل الـ transliterate المحلي فقط — لا مكالمة Google (تجنّب الترجمة
        // المكرّرة والحفاظ على مطابقة السكربت العربي ببحث #2).
        final String  translit  = isArabic ? SmartNameMatcher.transliterate(normQ) : normQ;
        final String  effQ      = translit;
        final String  phoneticQ = PhoneticUtil.encodeFullName(effQ);

        final NativeQuery esQuery = buildQuery(normQ, effQ, phoneticQ, isArabic, tenantId, page, size);
        final double      pepThr  = Math.min(threshold, 75.0);

        CompletableFuture<List<SanctionSearchResult>> esFuture =
            CompletableFuture.supplyAsync(() -> runEs(esQuery, threshold, normQ, effQ, isArabic), VIRTUAL_EXECUTOR);

        CompletableFuture<List<SanctionSearchResult>> pepFuture =
            CompletableFuture.supplyAsync(() -> {
                try { return pepSearchService.searchPep(normQ, pepThr); }
                catch (Exception e) { return List.of(); }
            }, VIRTUAL_EXECUTOR);

        try {
            CompletableFuture.allOf(esFuture, pepFuture).get(DEADLINE_MS, TimeUnit.MILLISECONDS);
        } catch (TimeoutException e) {
            log.warn("⚠️ Deadline {}ms — ES={} PEP={}", DEADLINE_MS, esFuture.isDone(), pepFuture.isDone());
        } catch (Exception e) {
            log.error("Search allOf error: {}", e.getMessage());
        }

        List<SanctionSearchResult> results = new ArrayList<>();
        if (esFuture.isDone() && !esFuture.isCompletedExceptionally())
            results.addAll(esFuture.getNow(List.of()));
        if (pepFuture.isDone() && !pepFuture.isCompletedExceptionally())
            results.addAll(pepFuture.getNow(List.of()));

        List<SanctionSearchResult> deduped = results.stream()
            .collect(java.util.stream.Collectors.collectingAndThen(
                java.util.stream.Collectors.toMap(
                    r -> r.getSource() + "|" + (r.getId() != null
                        ? r.getId().toString() : r.getName().toLowerCase().trim()),
                    r -> r,
                    (a, b) -> a.getScore() >= b.getScore() ? a : b,
                    java.util.LinkedHashMap::new),
                m -> new ArrayList<>(m.values())));
        deduped.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));

        if (!deduped.isEmpty()) searchCache.put(cacheKey, new CacheEntry(deduped));
        return deduped;
    }

    private NativeQuery buildQuery(String normQ, String effQ, String phoneticQ,
                                    boolean isArabic, Long tenantId, int page, int size) {
        // حجم الـ retrieval الداخلي أكبر بكتير من النتيجة النهائية:
        // الـ ES بيرتّب حسب relevance تبعه (مش المطابقة الذكية)، فلازم يجيب
        // مرشّحين كفاية حتى المطابقة الصوتية (score أقل بالـ ES) ما تنزاح برّا.
        int retrievalSize = Math.max(size, 400);
        return NativeQuery.builder()
            .withQuery(q -> q.bool(b -> {
                b.should(s -> s.matchPhrase(m -> m.field("name").query(effQ).boost(10.0f)));
                b.should(s -> s.multiMatch(m -> m
                    .fields("name^8", "aliases^5", "translatedName^5")
                    .query(effQ).type(TextQueryType.BestFields)
                    .fuzziness("2").prefixLength(0).minimumShouldMatch("60%").boost(7.0f)));
                b.should(s -> s.matchPhrasePrefix(m -> m.field("name").query(effQ).boost(5.0f)));
                b.should(s -> s.match(m -> m.field("phoneticName").query(phoneticQ)
                    .fuzziness("0").minimumShouldMatch("50%").boost(8.0f)));
                if (isArabic) {
                    b.should(s -> s.multiMatch(m -> m
                        .fields("translatedName^7", "name^5", "aliases^4")
                        .query(normQ).type(TextQueryType.BestFields)
                        .fuzziness("2").prefixLength(0).minimumShouldMatch("55%").boost(6.0f)));
                }
                b.minimumShouldMatch("1");

                // ── عزل القوائم الداخلية (INTERNAL) حسب الشركة ──────────────
                // filter = ما بيأثر على الـ score، بس بيمنع دخول سجلات شركة
                // تانية للـ retrieval. non-INTERNAL بيطلع للجميع.
                if (tenantId != null) {
                    final long tid = tenantId;
                    b.filter(f -> f.bool(fb -> fb
                        // إما مش INTERNAL (عالمي: OFAC/UN/EU/UK/LOCAL...)
                        .should(sh -> sh.bool(nb -> nb.mustNot(mn ->
                            mn.term(t -> t.field("source").value("INTERNAL")))))
                        // أو INTERNAL بس تبع شركتي
                        .should(sh -> sh.term(t -> t.field("tenantId").value(tid)))
                        .minimumShouldMatch("1")
                    ));
                } else {
                    // بلا tenant (SUPER_ADMIN أو warm-up) → استثنِ كل INTERNAL
                    b.filter(f -> f.bool(nb -> nb.mustNot(mn ->
                        mn.term(t -> t.field("source").value("INTERNAL")))));
                }

                return b;
            }))
            .withPageable(PageRequest.of(0, retrievalSize))
            .build();
    }

    // ══════════════════════════════════════════
    //  RUN ES
    // ══════════════════════════════════════════
    private List<SanctionSearchResult> runEs(NativeQuery query, double threshold,
                                              String normQ, String effQ, boolean isArabic) {
        List<SanctionSearchResult> out = new ArrayList<>();

        // query tokens للـ key-token filter — بس الكلمات الطويلة
        final List<String> keyTokensEn = SmartNameMatcher.tokenize(effQ).stream()
            .filter(t -> t.length() >= 4).toList();
        final List<String> keyTokensAr = isArabic
            ? SmartNameMatcher.tokenize(normQ).stream().filter(t -> t.length() >= 3).toList()
            : List.of();


        try {
            SearchHits<SanctionSearchDocument> hits =
                elasticsearchOperations.search(query, SanctionSearchDocument.class);
                log.info("🎯 ES raw hits: {}", hits.getTotalHits());


            hits.stream().map(hit -> {
                SanctionSearchDocument doc     = hit.getContent();
                String docName  = doc.getName()          != null ? doc.getName()          : "";
                String docTrans = doc.getTranslatedName() != null ? doc.getTranslatedName(): "";
                List<String> docAlias = parseAliases(doc.getAliases());

                // ── 1. Score من الاسم الرئيسي فقط (بدون aliases) ──────────────
                double simName = SmartNameMatcher.match(effQ, docName);
                if (!docTrans.isBlank())
                    simName = Math.max(simName, SmartNameMatcher.match(effQ, docTrans));
                if (isArabic && !docTrans.isBlank())
                    simName = Math.max(simName, SmartNameMatcher.match(normQ, docTrans));
                if (isArabic) {
                    simName = Math.max(simName, SmartNameMatcher.phoneticSimilarity(effQ, docName) * 0.88);
                    if (!docTrans.isBlank())
                        simName = Math.max(simName, SmartNameMatcher.phoneticSimilarity(effQ, docTrans) * 0.95);
                }
                if (isArabic && SmartNameMatcher.isArabic(docName))
                    simName = Math.max(simName, SmartNameMatcher.match(normQ, docName));
                simName = Math.min(simName, 100.0);

                // ── 2. Score من الـ aliases (منفصل — لا يرفع simName) ──────────
                double simAlias = docAlias.stream()
                    .mapToDouble(a -> SmartNameMatcher.match(effQ, a))
                    .max().orElse(0.0);
                if (isArabic) {
                    double alPh = docAlias.stream()
                        .mapToDouble(a -> SmartNameMatcher.phoneticSimilarity(effQ, a) * 0.85)
                        .max().orElse(0.0);
                    simAlias = Math.max(simAlias, alPh);
                }
                simAlias = Math.min(simAlias * 0.88, 100.0);

                // ── 3. finalSim = أعلى قيمة ──────────────────────────────────
                double finalSim = Math.max(simName, simAlias);

                // ── 4. Key-token filter ───────────────────────────────────────
                // لو ما في key token من الـ query موجود بالـ document → FP
                if (!keyTokensEn.isEmpty()) {
                    List<String> allDocTokens = buildDocTokens(docName, docTrans, docAlias);

                    boolean hasKeyToken = keyTokensEn.stream().anyMatch(qt -> allDocTokens.stream()
                        .anyMatch(dt -> SmartNameMatcher.tokenSim(qt, dt) >= 75.0));

                    if (!hasKeyToken && !keyTokensAr.isEmpty()) {
                        hasKeyToken = keyTokensAr.stream().anyMatch(qt -> allDocTokens.stream()
                            .anyMatch(dt -> SmartNameMatcher.tokenSim(qt, dt) >= 75.0));
                    }

                    if (!hasKeyToken) {
                        log.debug("🚫 FP blocked (no key token): query='{}' doc='{}'", effQ, docName);
                        finalSim = Math.min(finalSim, 69.0);
                    }

                    // ── 5. First-token order check — أُزيل (إصلاح تموز ٢٠٢٦) ────
                    //  كان بيقارن أول token مهم من الـ query بأول token من الـ docName،
                    //  ولو اختلفوا بيكبس finalSim على 74 (< threshold 75) = صفر تنبيه.
                    //  المشكلة: بيكبس *كل* اسم معكوس الترتيب — وهو أشهر أسلوب تحايل على
                    //  قوائم العقوبات — مقابل حماية حالة FP واحدة حدّية (Saleh Al-Ali ↔
                    //  Ali Salehi) هي أصلاً near-permutation ما بتنفصل عن reorder شرعي.
                    //  أثبت الاختبار: مع البوابة = 0/26 استرجاع للأسماء المعكوسة؛ بدونها
                    //  = 26/26 بدرجاتها الحقيقية (95). الـ recall بفحص العقوبات أهم من
                    //  الـ precision، والـ matcher أصلاً بيتعامل مع الترتيب صح (subset=95).
                    //  حماية الأسماء المختلفة فعلياً بتضل قائمة عبر:
                    //   • Key-token filter (خطوة 4 فوق) — بيحجب لو ما في key token مشترك.
                    //   • الـ matcher نفسو — (khaled≠walid=50، omar≠osama=0 بلا هالبوابة).
                }


                UUID id;
                try   { id = UUID.fromString(doc.getId()); }
                catch (Exception e) { id = UUID.nameUUIDFromBytes(doc.getId().getBytes()); }

                return new SanctionSearchResult(
                    id, doc.getName(), finalSim, doc.getSource(), finalSim, simAlias);
            })
            .filter(r -> r.getNameSimilarity() >= threshold)
            .forEach(out::add);

        } catch (Exception e) {
            log.error("ES error: {}", e.getMessage(), e);
        }

        // رتّب حسب المطابقة الذكية (مش relevance الـ ES) وخُد الأفضل
        out.sort((a, b) -> Double.compare(b.getNameSimilarity(), a.getNameSimilarity()));
        return out;
    }

    // ── buildDocTokens — يجمع tokens من الاسم + الترجمة + الـ aliases ──────
    private List<String> buildDocTokens(String docName, String docTrans, List<String> docAlias) {
        List<String> tokens = new ArrayList<>();
        if (SmartNameMatcher.isArabic(docName)) {
            tokens.addAll(SmartNameMatcher.tokenize(SmartNameMatcher.transliterate(
                SmartNameMatcher.normalizeAr(docName))));
            tokens.addAll(SmartNameMatcher.tokenize(SmartNameMatcher.normalizeAr(docName)));
        } else {
            tokens.addAll(SmartNameMatcher.tokenize(SmartNameMatcher.normalizeEn(docName)));
        }
        if (!docTrans.isBlank())
            tokens.addAll(SmartNameMatcher.tokenize(SmartNameMatcher.normalizeEn(docTrans)));
        for (String alias : docAlias) {
            if (SmartNameMatcher.isArabic(alias)) {
                tokens.addAll(SmartNameMatcher.tokenize(SmartNameMatcher.transliterate(
                    SmartNameMatcher.normalizeAr(alias))));
                tokens.addAll(SmartNameMatcher.tokenize(SmartNameMatcher.normalizeAr(alias)));
            } else {
                tokens.addAll(SmartNameMatcher.tokenize(SmartNameMatcher.normalizeEn(alias)));
            }
        }
        return tokens;
    }

    // ══════════════════════════════════════════
    //  getDetails
    // ══════════════════════════════════════════
    public Object getDetails(UUID id, String source) {
        if (source != null && source.contains("|")) {
            List<Object> list = new ArrayList<>();
            for (String s : source.split("\\|")) {
                Object d = getSingleDetail(id, s.trim());
                if (d != null) list.add(d);
            }
            return list.isEmpty() ? null : list;
        }
        return getSingleDetail(id, source);
    }

    private Object getSingleDetail(UUID id, String source) {
        // ── القوائم الداخلية — scoped بالـ tenant (دفاع بالعمق) ──
        if ("INTERNAL".equalsIgnoreCase(source)) {
            Long tenantId = resolveCurrentTenantId();
            if (tenantId == null) return null;
            return internalRepository.findByIdAndTenantId(id, tenantId).orElse(null);
        }
        if ("LOCAL".equalsIgnoreCase(source))
            return localRepository.findById(id).orElse(null);
        if ("OFAC".equalsIgnoreCase(source) || "EU".equalsIgnoreCase(source)
                || "UN".equalsIgnoreCase(source)  || "UK".equalsIgnoreCase(source)
                || "INTERPOL".equalsIgnoreCase(source) || "WORLD_BANK".equalsIgnoreCase(source)) {
            Optional<SanctionEntity> e = ofacRepository.findByUuidAndSource(id, source.toUpperCase());
            return e.isPresent() ? e.get() : ofacRepository.findById(id).orElse(null);
        }
        return null;
    }

    public void clearCache() {
        searchCache.clear();
        log.info(" Search cache cleared");
    }

    // ── parseAliases ──────────────────────────────────────────────────────────
    private List<String> parseAliases(List<String> raw) {
        if (raw == null || raw.isEmpty()) return List.of();
        List<String> out = new ArrayList<>();
        for (String r : raw) {
            if (r == null || r.isBlank()) continue;
            String t = r.trim();
            if (t.startsWith("{")) {
                String fn = extractJson(t, "firstName");
                String ln = extractJson(t, "lastName");
                String wn = extractJson(t, "wholeName");
                if (wn != null && !wn.isBlank()) { out.add(wn.trim()); continue; }
                StringBuilder sb = new StringBuilder();
                if (fn != null && !fn.isBlank()) sb.append(fn.trim());
                if (ln != null && !ln.isBlank()) { if (sb.length() > 0) sb.append(" "); sb.append(ln.trim()); }
                if (sb.length() > 0) out.add(sb.toString());
            } else {
                out.add(t);
            }
        }
        return out;
    }

    private String extractJson(String json, String field) {
        String key   = "\"" + field + "\":\"";
        int    start = json.indexOf(key);
        if (start < 0) return null;
        start += key.length();
        int end = json.indexOf("\"", start);
        return end < 0 ? null : json.substring(start, end);
    }
}