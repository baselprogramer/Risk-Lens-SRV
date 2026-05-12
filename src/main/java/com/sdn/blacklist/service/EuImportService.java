package com.sdn.blacklist.service;

import java.net.URL;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sdn.blacklist.common.util.NameTranslator;
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
    private final ObjectMapper objectMapper;

    private static final String EU_XML_URL =
        "https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content?token=dG9rZW4tMjAxNw";

    public EuImportService(SanctionRepository repository,
                           ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

   @Transactional
public ImportResult importEu() throws Exception {

    URL url = new URL(EU_XML_URL);

    JAXBContext context = JAXBContext.newInstance(EuExport.class);
    Unmarshaller unmarshaller = context.createUnmarshaller();

    EuExport list = (EuExport) unmarshaller.unmarshal(url);

    List<EuSanctionEntity> entities =
            Optional.ofNullable(list.getSanctionEntities())
                    .orElse(Collections.emptyList());

    int total = entities.size();
    int saved = 0;

    for (EuSanctionEntity entry : entities) {

        try {

            Long logicalId = entry.getLogicalId();
            if (logicalId == null) continue;

            SanctionEntity sanction =
                    repository.findByOfacUid(logicalId)
                            .orElse(new SanctionEntity());

            // ===== SAFE NAME HANDLING =====
            List<EuNameAlias> aliases =
                    Optional.ofNullable(entry.getNameAliases())
                            .orElse(Collections.emptyList());

        String mainName = aliases.stream()
       .filter(a -> Boolean.TRUE.equals(a.getStrong()))
        .map(EuNameAlias::getWholeName)
        .filter(Objects::nonNull)
        .findFirst()
        .orElse(
                aliases.stream()
                        .map(EuNameAlias::getWholeName)
                        .filter(Objects::nonNull)
                        .findFirst()
                        .orElse("UNKNOWN")
        );

            // ===== Convert aliases → List<String> =====
            List<String> aliasNames = aliases.stream()
                    .map(EuNameAlias::getWholeName)
                    .toList();

            // ===== Convert citizenships → List<String> =====
            List<String> nationalities =
                    Optional.ofNullable(entry.getCitizenships())
                            .orElse(Collections.emptyList())
                            .stream()
                            .map(c -> c.getCountryDescription())
                            .toList();

            // ===== Convert birthdates → List<String> =====
List<String> birthDates = Optional
        .ofNullable(entry.getBirthdates())
        .orElse(Collections.emptyList())
        .stream()
        .map(b -> 
            (b.getYear() != null ? b.getYear() : "") +
            (b.getCity() != null ? " - " + b.getCity() : "")
        )
        .toList();

sanction.setDateOfBirth(birthDates);
            // ===== FINAL MAPPING =====
            sanction.setOfacUid(logicalId);
            sanction.setName(mainName);
            sanction.setSource("EU");
            sanction.setProgram(
                    entry.getRegulation() != null
                            ? entry.getRegulation().getProgramme()
                            : null
            );
            sanction.setAliases(aliasNames);
            sanction.setNationality(nationalities);
            sanction.setDateOfBirth(birthDates);
            sanction.setRawData(objectMapper.writeValueAsString(entry));
            sanction.setLastSyncedAt(LocalDateTime.now());
            sanction.setActive(true);
            sanction.setTranslatedName(NameTranslator.translateName(mainName));
            repository.save(sanction);
            saved++;

        } catch (Exception e) {

            System.err.println("Failed to import EU entity ID: "
                    + entry.getLogicalId());
            e.printStackTrace();
        }
    }

    return new ImportResult(total, saved);
}
}