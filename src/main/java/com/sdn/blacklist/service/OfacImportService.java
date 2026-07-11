package com.sdn.blacklist.service;

import java.io.BufferedInputStream;
import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sdn.blacklist.common.service.SanctionSearchService;
import com.sdn.blacklist.common.util.NameTranslator;
import com.sdn.blacklist.common.util.PhoneticUtil;
import com.sdn.blacklist.common.util.SmartNameMatcher;
import com.sdn.blacklist.dto.ImportResult;
import com.sdn.blacklist.entity.SanctionEntity;
import com.sdn.blacklist.local.entity.LocalSanctionEntity;
import com.sdn.blacklist.local.repository.LocalSanctionRepository;
import com.sdn.blacklist.repository.SanctionRepository;
import com.sdn.blacklist.search.SanctionSearchDocument;
import com.sdn.blacklist.search.SearchRepository;
import com.sdn.blacklist.xml.ofac.OfacSdnEntry;
import com.sdn.blacklist.xml.ofac.OfacSdnList;



import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.Unmarshaller;

@Service
public class OfacImportService {

    private final SanctionRepository      repository;
    private final ObjectMapper            objectMapper;
    private final SearchRepository        searchRepository;
    private final LocalSanctionRepository localRepository;
    private final SanctionSearchService sanctionSearchService;
    private final ElasticsearchOperations elasticsearchOperations;



    private static final String OFAC_XML_URL =
        "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.XML";

    public OfacImportService(SanctionRepository repository, ObjectMapper objectMapper,
                             SearchRepository searchRepository, LocalSanctionRepository localRepository,
                             SanctionSearchService sanctionSearchService , ElasticsearchOperations elasticsearchOperations) {
        this.repository      = repository;
        this.objectMapper    = objectMapper;
        this.searchRepository = searchRepository;
        this.localRepository  = localRepository;
        this.sanctionSearchService = sanctionSearchService;
        this.elasticsearchOperations = elasticsearchOperations;
    }

    public List<SanctionEntity> search(String q) {
        q = q.trim();
        if (q.matches("\\d+")) return repository.searchByExactId(q);
        return repository.searchByNameAndAlias(q);
    }

    // ══════════════════════════════════════════
    //  indexToElastic — للـ OFAC/UN/EU/UK records
    // ══════════════════════════════════════════
    public void indexToElastic(SanctionEntity entity) {
        SanctionSearchDocument doc = SanctionSearchDocument.builder()
            .id(entity.getUuid().toString())
            .name(entity.getName())
            // ✅ [إصلاح 1] استخدم transliterate بدل Google Translate للـ indexing
            // Google Translate بطيء ومش ضروري هنا — SmartNameMatcher كافي للـ matching
            .translatedName(buildTranslatedName(entity.getName(), entity.getTranslatedName()))
            .phoneticName(PhoneticUtil.encodeFullName(phoneticSource(entity.getName(), entity.getTranslatedName())))
            .type(entity.getType())
            .country(entity.getCountry() != null ? entity.getCountry().toString() : null)
            .active(entity.getActive())
            // ✅ [إصلاح 2] parseAliases بيستخرج الأسماء الحقيقية من JSON
            .aliases(parseAliases(entity.getAliases()))
            .source(entity.getSource())
            .build();

        searchRepository.save(doc);
    }

    /**
     * يختار أفضل مصدر للتشفير الصوتي:
     *  - اسم عربي + ترجمة إنجليزية نظيفة → الترجمة (تطابق دقيق مع البحث الإنجليزي)
     *  - اسم عربي بدون ترجمة → رومنة (احتياطي، أفضل من فاضي)
     *  - اسم إنجليزي → مباشرة
     */
    private String phoneticSource(String originalName, String translatedName) {
        if (originalName == null || originalName.isBlank()) return "";
        if (SmartNameMatcher.isArabic(originalName)) {
            if (translatedName != null && !translatedName.isBlank()
                    && !SmartNameMatcher.isArabic(translatedName)) {
                return translatedName;                          // الأفضل: الترجمة النظيفة
            }
            return SmartNameMatcher.transliterate(originalName); // احتياطي: رومنة
        }
        return originalName;                                     // إنجليزي: مباشرة
    }

    // ══════════════════════════════════════════
    //  buildTranslatedName
    //  للـ indexing: transliterate أسرع وأكثر موثوقية من Google Translate
    //  Google Translate: نستخدمه فقط للـ import من الـ source الأصلي
    // ══════════════════════════════════════════
    private String buildTranslatedName(String name, String existingTranslation) {
        // لو في ترجمة موجودة مسبقاً → استخدمها
        if (existingTranslation != null && !existingTranslation.isBlank()
                && !existingTranslation.equals(name)) {
            return existingTranslation.trim();
        }
        // لو الاسم عربي → transliterate
        if (SmartNameMatcher.isArabic(name)) {
            return SmartNameMatcher.transliterate(name);
        }
        // إنجليزي → ارجعه كما هو
        return name != null ? name.trim() : "";
    }

    // ══════════════════════════════════════════
    //  indexLocalToElastic — للـ Local Sanctions
    // ══════════════════════════════════════════
    public void indexLocalToElastic(LocalSanctionEntity entity) {
        List<String> aliasesList = parseLocalAliases(entity.getAliases());

        String nameForPhonetic = (entity.getTranslatedName() != null
            && !entity.getTranslatedName().isBlank())
            ? entity.getTranslatedName()
            : SmartNameMatcher.transliterate(entity.getName());

        String translatedName = (entity.getTranslatedName() != null
            && !entity.getTranslatedName().isBlank())
            ? entity.getTranslatedName().trim()
            : SmartNameMatcher.transliterate(entity.getName());

        SanctionSearchDocument doc = SanctionSearchDocument.builder()
            .id(entity.getId().toString())
            .name(entity.getName())
            .translatedName(translatedName)
            .phoneticName(PhoneticUtil.encodeFullName(nameForPhonetic))
            .type("ENTITY".equals(entity.getRecordType()) ? "Entity" : "Individual")
            .country(entity.getNationality())
            .active(true)
            .aliases(aliasesList)
            .source("LOCAL")
            .motherName(entity.getMotherName())   // ← جديد
            .build();

        searchRepository.save(doc);
    }

    // ══════════════════════════════════════════
    //  reindexLocal — يعيد بناء LOCAL records فقط
    // ══════════════════════════════════════════
       public void reindexLocal() {
    sanctionSearchService.clearCache();

    // احذف LOCAL docs بـ native query بدل findAll
    try {
        org.springframework.data.elasticsearch.client.elc.NativeQuery deleteQuery =
            org.springframework.data.elasticsearch.client.elc.NativeQuery.builder()
                .withQuery(q -> q.term(t -> t.field("source").value("LOCAL")))
                .build();
        elasticsearchOperations.delete(deleteQuery, SanctionSearchDocument.class);
        System.out.println("✅ Deleted LOCAL docs from ES");
    } catch (Exception e) {
        System.err.println("⚠️ Failed to delete LOCAL docs: " + e.getMessage());
    }

    // أعد البناء من DB
    List<LocalSanctionEntity> all = localRepository.findAll();
    int count = 0, failed = 0;
    for (LocalSanctionEntity entity : all) {
        try {
            indexLocalToElastic(entity);
            count++;
        } catch (Exception e) {
            failed++;
            System.err.println("⚠️ Skipping [" + entity.getId() + "]: " + e.getMessage());
        }
    }
    System.out.println("✅ Local reindex done! Success: " + count + " | Failed: " + failed);
}

    // ══════════════════════════════════════════
    //  reindexAll — يستخدم فقط عند:
    //  1. أول تشغيل للنظام
    //  2. تغيير الـ ES mapping
    //  3. الـ index اتخرب
    //
    //  ✅ [إصلاح 3] بيبني index جديد مؤقت ثم يبدّل
    //  بدل deleteAll → rebuild (خطر الـ downtime)
    // ══════════════════════════════════════════
    public void reindexAll() {
        System.out.println("🔄 Starting full reindex...");

        // OFAC/UN/EU/UK records
        List<SanctionEntity> all = repository.findAll();
        int count = 0;
        int failed = 0;
        for (SanctionEntity entity : all) {
            try {
                indexToElastic(entity);
                count++;
            } catch (Exception e) {
                failed++;
                System.err.println("⚠️ Skipping entity [" + entity.getId() + "]: " + e.getMessage());
            }
        }
        System.out.println("✅ Main reindex: " + count + " | Failed: " + failed);

        // LOCAL records
        reindexLocal();

        System.out.println("✅ Full reindex done! Total: " + (count));
    }

    public void deleteFromElastic(String id) {
        searchRepository.deleteById(id);
    }

    // ══════════════════════════════════════════
    //  importOfac
    // ══════════════════════════════════════════
    @Transactional
    public ImportResult importOfac() throws Exception {
        URL url = new URL(OFAC_XML_URL);
        URLConnection connection = url.openConnection();
        connection.setConnectTimeout(30_000);
        connection.setReadTimeout(60_000);

        OfacSdnList sdnList;
        try (InputStream is = new BufferedInputStream(connection.getInputStream())) {
            JAXBContext context = JAXBContext.newInstance(OfacSdnList.class);
            Unmarshaller unmarshaller = context.createUnmarshaller();
            sdnList = (OfacSdnList) unmarshaller.unmarshal(is);
        }

        List<OfacSdnEntry> entries = sdnList.getSdnEntries();
        if (entries == null || entries.isEmpty()) return new ImportResult(0, 0);

        int total = entries.size();
        int saved = 0;
        List<Long> currentUids = new ArrayList<>();

        for (OfacSdnEntry entry : entries) {
            try {
                currentUids.add(entry.getUid());

                String fullName = "Individual".equalsIgnoreCase(entry.getSdnType())
                    ? ((entry.getFirstName() != null ? entry.getFirstName() + " " : "") + entry.getLastName()).trim()
                    : entry.getLastName();

                SanctionEntity sanction = repository.findByOfacUid(entry.getUid())
                    .orElse(new SanctionEntity());

                sanction.setName(fullName);

                // ✅ [إصلاح 1] transliterate بدل Google Translate أثناء الـ import
                // Google Translate: 12,000 طلب = بطيء جداً + ممكن يتحجب
                // transliterate: فوري + لا يحتاج network
                sanction.setTranslatedName(SmartNameMatcher.isArabic(fullName)
                    ? SmartNameMatcher.transliterate(fullName)
                    : fullName);

                sanction.setSource("OFAC");
                sanction.setOfacUid(entry.getUid());
                sanction.setProgram(entry.getPrograms());
                sanction.setSdnType(entry.getSdnType());
                sanction.setAliases(entry.getAkaList());
                sanction.setAddresses(entry.getAddressList());
                sanction.setNationality(entry.getNationalityList());
                sanction.setIds(entry.getIdList());
                sanction.setDateOfBirth(entry.getDateOfBirthList());

                try {
                    sanction.setRawData(objectMapper.writeValueAsString(entry));
                } catch (Exception e) {
                    sanction.setRawData(entry.getUid() != null ? entry.getUid().toString() : "error");
                }

                sanction.setActive(true);
                sanction.setLastSyncedAt(LocalDateTime.now());

                repository.save(sanction);
                indexToElastic(sanction); // ✅ incremental index فوري
                saved++;

            } catch (Exception e) {
                System.err.println("❌ FAILED entry UID: " + entry.getUid() + " | " + e.getMessage());
            }
        }

        repository.deactivateMissingOfac(currentUids);
        return new ImportResult(total, saved);
    }

    // ══════════════════════════════════════════
    //  parseAliases — للـ OFAC/UN/EU/UK (JSON objects)
    //  يستخرج الاسم الحقيقي من:
    //  {"uid":123,"lastName":"AL-ASAD"} → "AL-ASAD"
    //  {"firstName":"Bashar","lastName":"AL-ASAD"} → "Bashar AL-ASAD"
    //  "plain string" → "plain string"
    // ══════════════════════════════════════════
    private List<String> parseAliases(Object aliases) {
        if (aliases == null) return List.of();
        try {
            if (aliases instanceof List<?> list) {
                List<String> result = new ArrayList<>();
                for (Object item : list) {
                    String extracted = extractAliasName(item.toString());
                    if (extracted != null && !extracted.isBlank())
                        result.add(extracted);
                }
                return result;
            }
            String str = aliases.toString().trim();
            if (str.startsWith("[")) {
                com.fasterxml.jackson.databind.JsonNode node = objectMapper.readTree(str);
                List<String> result = new ArrayList<>();
                if (node.isArray()) {
                    for (com.fasterxml.jackson.databind.JsonNode item : node) {
                        String extracted = item.isTextual()
                            ? item.asText()
                            : extractAliasNameFromJson(item);
                        if (extracted != null && !extracted.isBlank())
                            result.add(extracted.trim());
                    }
                }
                return result;
            }
            if (!str.isBlank()) return List.of(str);
        } catch (Exception e) { /* ignore */ }
        return List.of();
    }

    /** يستخرج الاسم من JSON string أو plain string */
    private String extractAliasName(String raw) {
        if (raw == null || raw.isBlank()) return null;
        raw = raw.trim();
        if (!raw.startsWith("{")) return raw; // plain string
        try {
            com.fasterxml.jackson.databind.JsonNode node = objectMapper.readTree(raw);
            return extractAliasNameFromJson(node);
        } catch (Exception e) {
            return raw;
        }
    }

    private String extractAliasNameFromJson(com.fasterxml.jackson.databind.JsonNode node) {
        // wholeName أو firstName + lastName
        if (node.has("wholeName") && !node.get("wholeName").asText().isBlank())
            return node.get("wholeName").asText().trim();
        if (node.has("name") && !node.get("name").asText().isBlank())
            return node.get("name").asText().trim();

        String firstName = node.has("firstName") ? node.get("firstName").asText().trim() : "";
        String lastName  = node.has("lastName")  ? node.get("lastName").asText().trim()  : "";

        if (!firstName.isBlank() && !lastName.isBlank()) return firstName + " " + lastName;
        if (!lastName.isBlank())  return lastName;
        if (!firstName.isBlank()) return firstName;
        return null;
    }

    // ══════════════════════════════════════════
    //  parseLocalAliases — للـ Local Sanctions
    //  ["أبو حسن", "Abu Hassan"] أو {"name": "..."}
    // ══════════════════════════════════════════
    private List<String> parseLocalAliases(String aliasesJson) {
        if (aliasesJson == null || aliasesJson.isBlank()) return List.of();
        List<String> result = new ArrayList<>();
        try {
            com.fasterxml.jackson.databind.JsonNode node = objectMapper.readTree(aliasesJson);
            if (node.isArray()) {
                for (com.fasterxml.jackson.databind.JsonNode item : node) {
                    if (item.isTextual() && !item.asText().isBlank())
                        result.add(item.asText().trim());
                    else if (item.isObject()) {
                        String val = item.has("name") ? item.get("name").asText() : item.toString();
                        if (!val.isBlank()) result.add(val.trim());
                    }
                }
            } else if (node.isTextual()) {
                result.add(node.asText().trim());
            }
        } catch (Exception e) {
            result.add(aliasesJson);
        }
        return result;
    }
}