package com.sdn.blacklist.service;

import java.net.URL;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sdn.blacklist.common.util.SmartNameMatcher;
import com.sdn.blacklist.dto.ImportResult;
import com.sdn.blacklist.entity.SanctionEntity;
import com.sdn.blacklist.repository.SanctionRepository;
import com.sdn.blacklist.xml.eu.EuExport;
import com.sdn.blacklist.xml.eu.EuNameAlias;
import com.sdn.blacklist.xml.eu.EuSanctionEntity;

import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.Unmarshaller;

@Service
public class EuImportService {

    private final SanctionRepository repository;
    private final ObjectMapper       objectMapper;
    private final OfacImportService  ofacImportService; // ✅ للـ indexToElastic

    private static final String EU_XML_URL =
        "https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content?token=dG9rZW4tMjAxNw";

    public EuImportService(SanctionRepository repository,
                           ObjectMapper objectMapper,
                           OfacImportService ofacImportService) {
        this.repository        = repository;
        this.objectMapper      = objectMapper;
        this.ofacImportService = ofacImportService;
    }

    @Transactional
    public ImportResult importEu() throws Exception {

        URL url = new URL(EU_XML_URL);
        JAXBContext context = JAXBContext.newInstance(EuExport.class);
        Unmarshaller unmarshaller = context.createUnmarshaller();
        EuExport list = (EuExport) unmarshaller.unmarshal(url);

        List<EuSanctionEntity> entities = Optional.ofNullable(list.getSanctionEntities())
            .orElse(Collections.emptyList());

        int total = entities.size();
        int saved = 0;
        // ✅ تتبع الـ IDs للـ deactivate
        List<Long> processedUids = new ArrayList<>();

        for (EuSanctionEntity entry : entities) {
            try {
                Long logicalId = entry.getLogicalId();
                if (logicalId == null) continue;

                // ✅ EU فقط — ما يتعارض مع OFAC/UN records
                SanctionEntity sanction = repository.findByOfacUidAndSource(logicalId, "EU")
                    .orElse(new SanctionEntity());

                // ── الاسم الرئيسي ──
                List<EuNameAlias> aliases = Optional.ofNullable(entry.getNameAliases())
                    .orElse(Collections.emptyList());

                String mainName = aliases.stream()
                    .filter(a -> Boolean.TRUE.equals(a.getStrong()))
                    .map(EuNameAlias::getWholeName)
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElse(aliases.stream()
                        .map(EuNameAlias::getWholeName)
                        .filter(Objects::nonNull)
                        .findFirst()
                        .orElse("UNKNOWN"));

                // ── aliases ──
                List<String> aliasNames = aliases.stream()
                    .map(EuNameAlias::getWholeName)
                    .filter(Objects::nonNull)
                    .toList();

                // ── nationalities ──
                List<String> nationalities = Optional.ofNullable(entry.getCitizenships())
                    .orElse(Collections.emptyList()).stream()
                    .map(c -> c.getCountryDescription())
                    .toList();

                // ── birthdates ──
                List<String> birthDates = Optional.ofNullable(entry.getBirthdates())
                    .orElse(Collections.emptyList()).stream()
                    .map(b -> (b.getYear() != null ? b.getYear() : "")
                            + (b.getCity() != null ? " - " + b.getCity() : ""))
                    .toList();

                // ── mapping ──
                sanction.setOfacUid(logicalId);
                sanction.setName(mainName);
                sanction.setSource("EU");
                sanction.setProgram(entry.getRegulation() != null
                    ? entry.getRegulation().getProgramme() : null);
                sanction.setAliases(aliasNames);
                sanction.setNationality(nationalities);
                sanction.setDateOfBirth(birthDates);
                sanction.setRawData(objectMapper.writeValueAsString(entry));
                sanction.setLastSyncedAt(LocalDateTime.now());
                sanction.setActive(true);

                // ✅ [إصلاح 1] transliterate بدل Google Translate
                sanction.setTranslatedName(SmartNameMatcher.isArabic(mainName)
                    ? SmartNameMatcher.transliterate(mainName)
                    : mainName);

                repository.save(sanction);

                // ✅ index في ES فوراً بعد الـ save
                ofacImportService.indexToElastic(sanction);

                // ✅ تتبع الـ UID
                processedUids.add(logicalId);
                saved++;

            } catch (Exception e) {
                System.err.println("❌ Failed EU entity ID: " + entry.getLogicalId()
                    + " | " + e.getMessage());
            }
        }

        // ✅ deactivate المفقودين من EU فقط
        if (!processedUids.isEmpty()) {
            repository.deactivateMissingEu(processedUids);
        }

        return new ImportResult(total, saved);
    }
}