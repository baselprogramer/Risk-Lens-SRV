package com.sdn.blacklist.service;

import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sdn.blacklist.common.util.SmartNameMatcher;
import com.sdn.blacklist.dto.ImportResult;
import com.sdn.blacklist.entity.SanctionEntity;
import com.sdn.blacklist.repository.SanctionRepository;
import com.sdn.blacklist.xml.un.UnEntity;
import com.sdn.blacklist.xml.un.UnEntityAlias;
import com.sdn.blacklist.xml.un.UnExport;
import com.sdn.blacklist.xml.un.UnIndividual;
import com.sdn.blacklist.xml.un.UnIndividualAlias;
import com.sdn.blacklist.xml.un.UnNationality;

import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.Unmarshaller;

@Service
public class UnImportService {

    private final SanctionRepository repository;
    private final OfacImportService   ofacImportService;

    private static final String UN_CONSOLIDATED_URL =
        "https://scsanctions.un.org/resources/xml/en/consolidated.xml";
    private static final String UN_ALQAIDA_URL =
        "https://scsanctions.un.org/xml/en/al-qaida";

    public UnImportService(SanctionRepository repository,
                           OfacImportService ofacImportService) {
        this.repository       = repository;
        this.ofacImportService = ofacImportService;
    }

    @Transactional
    public ImportResult importUn() throws Exception {
        // ✅ نجمع كل الـ UIDs من المصدرين عشان نعمل deactivate صح
        List<Long> allProcessedUids = new ArrayList<>();

        ImportResult consolidated = importFromUrl(UN_CONSOLIDATED_URL, allProcessedUids);
        ImportResult alQaida      = importFromUrl(UN_ALQAIDA_URL,      allProcessedUids);

        // ✅ deactivate المفقودين من UN فقط — بدون تأثير على OFAC
        if (!allProcessedUids.isEmpty()) {
            repository.deactivateMissingUn(allProcessedUids);
        }

        return new ImportResult(
            consolidated.getTotalEntries() + alQaida.getTotalEntries(),
            consolidated.getSavedRecords()  + alQaida.getSavedRecords()
        );
    }

    // ══════════════════════════════════════════
    //  Core import logic
    //  allProcessedUids: قائمة مشتركة بين المصدرين
    // ══════════════════════════════════════════
    private ImportResult importFromUrl(String xmlUrl, List<Long> allProcessedUids) throws Exception {

        URL url = new URL(xmlUrl);
        JAXBContext context = JAXBContext.newInstance(UnExport.class);
        Unmarshaller unmarshaller = context.createUnmarshaller();
        UnExport export = (UnExport) unmarshaller.unmarshal(url);

        List<UnIndividual> individuals = Optional.ofNullable(export.getIndividuals()).orElse(List.of());
        List<UnEntity>     entities    = Optional.ofNullable(export.getEntities()).orElse(List.of());

        int total = individuals.size() + entities.size();
        int saved = 0;

        // ── Individuals ──
        for (UnIndividual ind : individuals) {
            try {
                Long dataId = ind.getDataId();
                if (dataId == null) continue;

                // ✅ [إصلاح] findByOfacUidAndSource — UN فقط، ما يعدّل OFAC records
                SanctionEntity sanction = repository
                    .findByOfacUidAndSource(dataId, "UN")
                    .orElse(new SanctionEntity());

                sanction.setOfacUid(dataId);
                sanction.setSource("UN");
                sanction.setSdnType("Individual");
                sanction.setName(ind.getFullName());

                sanction.setAliases(Optional.ofNullable(ind.getAliases()).orElse(List.of())
                    .stream().map(UnIndividualAlias::getAliasName)
                    .filter(Objects::nonNull).toList());

                sanction.setDateOfBirth(Optional.ofNullable(ind.getDatesOfBirth()).orElse(List.of())
                    .stream().map(d -> d.getYear() != null ? d.getYear().toString() : "")
                    .filter(s -> !s.isBlank()).toList());

                sanction.setNationality(Optional.ofNullable(ind.getNationalities()).orElse(List.of())
                    .stream().map(UnNationality::getValue)
                    .filter(Objects::nonNull).toList());

                sanction.setRawData(ind.getComments());
                sanction.setActive(true);
                sanction.setProgram(List.of(ind.getUnListType()));

                String arabicName = ind.getNameOriginalScript();
                sanction.setTranslatedName(
                    (arabicName != null && !arabicName.isBlank())
                        ? arabicName
                        : SmartNameMatcher.isArabic(ind.getFullName())
                            ? SmartNameMatcher.transliterate(ind.getFullName())
                            : ind.getFullName()
                );

                repository.save(sanction);
                ofacImportService.indexToElastic(sanction);

                // ✅ تتبع الـ UIDs
                allProcessedUids.add(dataId);
                saved++;

            } catch (Exception e) {
                System.err.println("❌ Failed UN Individual ID: " + ind.getDataId()
                    + " | " + e.getMessage());
            }
        }

        // ── Entities ──
        for (UnEntity ent : entities) {
            try {
                Long dataId = ent.getDataId();
                if (dataId == null) continue;

                // ✅ [إصلاح] findByOfacUidAndSource — UN فقط
                SanctionEntity sanction = repository
                    .findByOfacUidAndSource(dataId, "UN")
                    .orElse(new SanctionEntity());

                sanction.setOfacUid(dataId);
                sanction.setSource("UN");
                sanction.setSdnType("Entity");
                sanction.setName(ent.getName());

                sanction.setAliases(Optional.ofNullable(ent.getAliases()).orElse(List.of())
                    .stream().map(UnEntityAlias::getAliasName)
                    .filter(Objects::nonNull).toList());

                sanction.setTranslatedName(
                    SmartNameMatcher.isArabic(ent.getName())
                        ? SmartNameMatcher.transliterate(ent.getName())
                        : ent.getName()
                );

                sanction.setRawData(ent.getComments());
                sanction.setActive(true);
                sanction.setProgram(List.of(ent.getUnListType()));

                repository.save(sanction);
                ofacImportService.indexToElastic(sanction);

                // ✅ تتبع الـ UIDs
                allProcessedUids.add(dataId);
                saved++;

            } catch (Exception e) {
                System.err.println("❌ Failed UN Entity ID: " + ent.getDataId()
                    + " | " + e.getMessage());
            }
        }

        return new ImportResult(total, saved);
    }
}