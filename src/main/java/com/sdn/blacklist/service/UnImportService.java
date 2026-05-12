package com.sdn.blacklist.service;

import java.net.URL;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sdn.blacklist.common.util.NameTranslator;
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

    private static final String UN_XML_URL =
            "https://scsanctions.un.org/resources/xml/en/consolidated.xml";

    public UnImportService(SanctionRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public ImportResult importUn() throws Exception {

        URL url = new URL(UN_XML_URL);

        JAXBContext context = JAXBContext.newInstance(UnExport.class);
        Unmarshaller unmarshaller = context.createUnmarshaller();

        UnExport export = (UnExport) unmarshaller.unmarshal(url);

        List<UnIndividual> individuals =
                Optional.ofNullable(export.getIndividuals())
                        .orElse(List.of());

        List<UnEntity> entities =
                Optional.ofNullable(export.getEntities())
                        .orElse(List.of());

        int total = individuals.size() + entities.size();
        int saved = 0;

        // ================================
        //  Individuals
        // ================================
        for (UnIndividual ind : individuals) {

            try {

                Long dataId = ind.getDataId();
                if (dataId == null) continue;

                SanctionEntity sanction =
                        repository.findByOfacUid(dataId)
                                .orElse(new SanctionEntity());
                sanction.setOfacUid(dataId);
                
                sanction.setSource("UN");
                sanction.setSdnType("Individual");

                sanction.setName(ind.getFullName());

                sanction.setAliases(
                        Optional.ofNullable(ind.getAliases())
                                .orElse(List.of())
                                .stream()
                                .map(UnIndividualAlias::getAliasName)
                                .filter(Objects::nonNull)
                                .toList()
                );

                sanction.setDateOfBirth(
                        Optional.ofNullable(ind.getDatesOfBirth())
                                .orElse(List.of())
                                .stream()
                                .map(d -> d.getYear() != null ? d.getYear().toString() : "")
                                .filter(s -> !s.isBlank())
                                .toList()
                );

                sanction.setNationality(
                        Optional.ofNullable(ind.getNationalities())
                                .orElse(List.of())
                                .stream()
                                .map(UnNationality::getValue)
                                .filter(Objects::nonNull)
                                .toList()
                );

                sanction.setRawData(ind.getComments());
                sanction.setActive(true);
                sanction.setProgram(ind.getUnListType());
                sanction.setTranslatedName(NameTranslator.translateName(ind.getFullName()));
                repository.save(sanction);
                saved++;

            } catch (Exception e) {
                System.err.println("Failed UN Individual ID: " + ind.getDataId());
                e.printStackTrace();
            }
        }

        // ================================
        //  Entities
        // ================================
        for (UnEntity ent : entities) {

            try {

                Long dataId = ent.getDataId();
                if (dataId == null) continue;

                SanctionEntity sanction =
                        repository.findByOfacUid(dataId)
                                .orElse(new SanctionEntity());

                sanction.setOfacUid(dataId);

                sanction.setSource("UN");
                sanction.setSdnType("Entity");

                sanction.setName(ent.getName());

                sanction.setAliases(
                        Optional.ofNullable(ent.getAliases())
                                .orElse(List.of())
                                .stream()
                                .map(UnEntityAlias::getAliasName)
                                .filter(Objects::nonNull)
                                .toList()
                );
                
                sanction.setTranslatedName(NameTranslator.translateName(ent.getName()));

                sanction.setRawData(ent.getComments());
                sanction.setActive(true);
                sanction.setProgram(ent.getUnListType());


                repository.save(sanction);
                saved++;

            } catch (Exception e) {
                System.err.println("Failed UN Entity ID: " + ent.getDataId());
                e.printStackTrace();
            }
        }

        return new ImportResult(total, saved);
    }
}
