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

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
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

    private final SanctionRepository repository;
    private final ObjectMapper objectMapper;
    private final SearchRepository searchRepository;
    private final LocalSanctionRepository localRepository;
    private static final String OFAC_XML_URL =
        "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.XML";

    public OfacImportService(
            SanctionRepository repository,
            ObjectMapper objectMapper ,SearchRepository searchRepository , LocalSanctionRepository localRepository) {

        this.repository = repository;
        this.objectMapper = objectMapper;
        this.searchRepository=searchRepository;
        this.localRepository = localRepository;

        
    }

        public List<SanctionEntity> search(String q) {
            q = q.trim();

            if (q.matches("\\d+")) {
                return repository.searchByExactId(q);
            }

            return repository.searchByNameAndAlias(q);
        }

public void indexToElastic(SanctionEntity entity) {

    //  استخدم getOfacUid() بدل getId()
    String esId = entity.getOfacUid() != null 
        ? String.valueOf(entity.getOfacUid())
        : entity.getExternalId() != null 
            ? entity.getExternalId()
            : UUID.randomUUID().toString();

    SanctionSearchDocument doc = SanctionSearchDocument.builder()
            .id(entity.getUuid().toString())                                        
            .name(entity.getName())
            .translatedName(
    entity.getTranslatedName() != null && !entity.getTranslatedName().isBlank()
        ? entity.getTranslatedName()
        : NameTranslator.translateName(entity.getName()) // fallback للجديد فقط
)
            .phoneticName(PhoneticUtil.encodeFullName(entity.getName()))
            .type(entity.getType())
            .country(entity.getCountry() != null
                ? entity.getCountry().toString()
                : null)
            .active(entity.getActive())
            .aliases(parseAliases(entity.getAliases()))
            .source(entity.getSource())
            .build();

    searchRepository.save(doc);
}

public void indexLocalToElastic(LocalSanctionEntity entity) {
 
    // ── parse الـ aliases من JSON string → List<String> ──
    List<String> aliasesList = new ArrayList<>();
    if (entity.getAliases() != null && !entity.getAliases().isBlank()) {
        try {
            com.fasterxml.jackson.databind.JsonNode node =
                objectMapper.readTree(entity.getAliases());
 
            if (node.isArray()) {
                // ["أبو حسن", "Abu Hassan"] ← array of strings
                for (com.fasterxml.jackson.databind.JsonNode item : node) {
                    if (item.isTextual() && !item.asText().isBlank()) {
                        aliasesList.add(item.asText().trim());
                    } else if (item.isObject()) {
                        // {"name": "Abu Hassan"} ← object
                        String val = item.has("name")
                            ? item.get("name").asText()
                            : item.toString();
                        if (!val.isBlank()) aliasesList.add(val.trim());
                    }
                }
            } else if (node.isTextual()) {
                // string مباشرة
                aliasesList.add(node.asText().trim());
            }
        } catch (Exception e) {
            // fallback — حط الـ string كما هو
            aliasesList.add(entity.getAliases());
        }
    }
 
    String nameForPhonetic = entity.getTranslatedName() != null
        && !entity.getTranslatedName().isBlank()
        ? entity.getTranslatedName()
        : SmartNameMatcher.arabicTransliterate(entity.getName());
 
    SanctionSearchDocument doc = SanctionSearchDocument.builder()
        .id(entity.getId().toString())
        .name(entity.getName())
        .translatedName(
           normalizeForIndex(
        entity.getTranslatedName() != null && !entity.getTranslatedName().isBlank()
            ? entity.getTranslatedName()
            : NameTranslator.translateName(entity.getName()) )
        )
        .phoneticName(PhoneticUtil.encodeFullName(nameForPhonetic))
        .type("Individual")
        .country(entity.getNationality())
        .active(true)
        .aliases(aliasesList)   //  List<String> صحيحة
        .source("LOCAL")
        .build();
 
    searchRepository.save(doc);
}


public void reindexLocal() {
    List<LocalSanctionEntity> all = localRepository.findAll();
    int count = 0;
    for (LocalSanctionEntity entity : all) {
        try {
            indexLocalToElastic(entity);
            count++;
            //  delay كل 5 records لتجنب spam على MyMemory
            if (count % 5 == 0) {
                Thread.sleep(200);
            }
        } catch (Exception e) {
            System.err.println("Skipping local entity: " + e.getMessage());
        }
    }
    System.out.println("✅ Local reindex done! Total: " + count);
}


public void reindexAll() {
    //  امسح كل الـ index أول
    searchRepository.deleteAll();
    
    List<SanctionEntity> all = repository.findAll();
    for (SanctionEntity entity : all) {
        try {
            indexToElastic(entity);
        } catch (Exception e) {
            System.err.println("Skipping entity due to error: " + e.getMessage());
        }
    }
     //  LOCAL
    reindexLocal();
    System.out.println("✅ Reindex done! Total: " + all.size());
}

public void deleteFromElastic(String id) {
    searchRepository.deleteById(id);
}

private String normalizeForIndex(String name) {
    if (name == null) return "";
    return name.replaceAll("(?i)\\bAl-", "Al")
               .replaceAll("(?i)\\bAl ", "Al")
               .replaceAll("\\s+", " ")
               .trim();
}

private List<String> parseAliases(Object aliases) {
    if (aliases == null) return List.of();
    
    try {
        // لو List مباشرة
        if (aliases instanceof List<?> list) {
            return list.stream().map(Object::toString).collect(Collectors.toList());
        }
        
        // لو String — حاول تعمل parse كـ JSON
        String str = aliases.toString().trim();
        if (str.startsWith("[")) {
            com.fasterxml.jackson.databind.JsonNode node = objectMapper.readTree(str);
            List<String> result = new ArrayList<>();
            if (node.isArray()) {
                for (com.fasterxml.jackson.databind.JsonNode item : node) {
                    if (item.isTextual()) {
                        result.add(item.asText());
                    } else if (item.isObject() && item.has("wholeName")) {
                        result.add(item.get("wholeName").asText());
                    } else if (item.isObject() && item.has("name")) {
                        result.add(item.get("name").asText());
                    } else {
                        result.add(item.toString());
                    }
                }
            }
            return result;
        }
        
        // String عادي
        if (!str.isBlank()) return List.of(str);
        
    } catch (Exception e) {
        // ignore
    }
    
    return List.of();
}


    @Transactional
    public ImportResult importOfac() throws Exception {

        // 🔹 1. Open connection with timeouts
        URL url = new URL(OFAC_XML_URL);
        URLConnection connection = url.openConnection();
        connection.setConnectTimeout(30_000); // 30 sec
        connection.setReadTimeout(60_000);   // 2 min

        OfacSdnList sdnList;

        try (InputStream is = new BufferedInputStream(connection.getInputStream())) {

            JAXBContext context = JAXBContext.newInstance(OfacSdnList.class);
            Unmarshaller unmarshaller = context.createUnmarshaller();

            sdnList = (OfacSdnList) unmarshaller.unmarshal(is);
        }

        List<OfacSdnEntry> entries = sdnList.getSdnEntries();
        if (entries == null || entries.isEmpty()) {
            return new ImportResult(0, 0);
        }

        int total = entries.size();
        int saved = 0;

        //   Map XML → DB
       int updatedOrInserted = 0;
List<Long> currentUids = new ArrayList<>();

for (OfacSdnEntry entry : entries) {

    currentUids.add(entry.getUid());

    String fullName;

    if ("Individual".equalsIgnoreCase(entry.getSdnType())) {
        fullName = (
                (entry.getFirstName() != null ? entry.getFirstName() + " " : "")
                        + entry.getLastName()
        ).trim();
    } else {
        fullName = entry.getLastName();
    }

    // هل موجود مسبقاً؟
    SanctionEntity sanction = repository
        .findByOfacUid(entry.getUid())
        .orElse(new SanctionEntity());

    //  تحديث الحقول دائماً
    sanction.setName(fullName);
    sanction.setTranslatedName(NameTranslator.translateName(fullName));
    sanction.setSource("OFAC");
    sanction.setOfacUid(entry.getUid());
    sanction.setProgram(entry.getPrograms());
    sanction.setSdnType(entry.getSdnType());
    sanction.setAliases(entry.getAkaList());
    sanction.setAddresses(entry.getAddressList());
    sanction.setNationality(entry.getNationalityList());
    sanction.setIds(entry.getIdList());
    sanction.setDateOfBirth(entry.getDateOfBirthList());
    sanction.setRawData(objectMapper.writeValueAsString(entry));
    sanction.setActive(true);
    sanction.setLastSyncedAt(LocalDateTime.now());

    repository.save(sanction);
    indexToElastic(sanction);
    updatedOrInserted++;


            saved++;
        }
        repository.deactivateMissingOfac(currentUids);

        return new ImportResult(total, saved);

        
    }


  
}

