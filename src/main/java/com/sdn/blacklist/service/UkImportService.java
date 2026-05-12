package com.sdn.blacklist.service;

import java.io.InputStream;
import java.net.URL;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sdn.blacklist.common.util.NameTranslator;
import com.sdn.blacklist.dto.ImportResult;
import com.sdn.blacklist.entity.SanctionEntity;
import com.sdn.blacklist.repository.SanctionRepository;
import com.sdn.blacklist.xml.uk.UkAddress;
import com.sdn.blacklist.xml.uk.UkDesignation;
import com.sdn.blacklist.xml.uk.UkIndividual;
import com.sdn.blacklist.xml.uk.UkName;
import com.sdn.blacklist.xml.uk.UkSanctionsRoot;

import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.Unmarshaller;

@Service
public class UkImportService {

    private final SanctionRepository repository;

    public UkImportService(SanctionRepository repository) {
        this.repository = repository;
    }

private static final String UK_XML_URL =
        "https://sanctionslist.fcdo.gov.uk/docs/UK-Sanctions-List.xml";

@Transactional
public ImportResult importUk() throws Exception {

    // فتح رابط الـ XML مباشرة
    URL url = new URL(UK_XML_URL);
    InputStream is = url.openStream();

    JAXBContext context = JAXBContext.newInstance(UkSanctionsRoot.class);
    Unmarshaller unmarshaller = context.createUnmarshaller();

    UkSanctionsRoot root = (UkSanctionsRoot) unmarshaller.unmarshal(is);

    List<UkDesignation> designations =
            Optional.ofNullable(root.getDesignations())
                    .orElse(List.of());

        int total = designations.size();
        int saved = 0;

        for (UkDesignation des : designations) {

            try {
                String dataId = des.getUniqueId();
                if (des.getUniqueId() == null) continue;

                SanctionEntity sanction =
                        repository.findByExternalIdAndSource(
                                dataId, "UK"
                        ).orElse(new SanctionEntity());

                sanction.setExternalId(dataId);
                sanction.setSource("UK");
                sanction.setSdnType(des.getIndividualEntityShip());
                
                String primaryName = extractPrimaryName(des);
                sanction.setName(primaryName);
                sanction.setTranslatedName(
                        NameTranslator.translateName(primaryName)
                );

             
                sanction.setAliases(extractAliases(des));

                sanction.setNationality(extractNationalities(des));

                sanction.setDateOfBirth(extractDobs(des));

                sanction.setAddresses(extractAddresses(des));

                sanction.setProgram(des.getRegimeName());

                sanction.setRawData(des.getOtherInformation());
                sanction.setActive(true);
                sanction.setLastSyncedAt(LocalDateTime.now());

                repository.save(sanction);
                saved++;

            } catch (Exception e) {
                System.err.println("Failed UK ID: " + des.getUniqueId());
                e.printStackTrace();
            }
        }

        return new ImportResult(total, saved);
    }


    //  Helper Methods


    private String extractPrimaryName(UkDesignation des) {

        if (des.getNames() == null) return null;

        return des.getNames().getNames().stream()
                .filter(n -> "Primary Name".equalsIgnoreCase(n.getNameType()))
                .map(UkName::buildFullName)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(
                    des.getNames().getNames().stream()
                        .findFirst()
                        .map(UkName::buildFullName)
                        .orElse(null)
                );
    }

    private Object extractAliases(UkDesignation des) {

        if (des.getNames() == null) return null;

        return des.getNames().getNames().stream()
                .filter(n -> !"Primary Name".equalsIgnoreCase(n.getNameType()))
                .map(UkName::buildFullName)
                .filter(Objects::nonNull)
                .toList();
    }

    private Object extractNationalities(UkDesignation des) {

        if (des.getIndividualDetails() == null) return null;

        UkIndividual ind = des.getIndividualDetails().getIndividual();
        if (ind == null || ind.getNationalities() == null) return null;

        return ind.getNationalities().getNationalities();
    }

    private Object extractDobs(UkDesignation des) {

        if (des.getIndividualDetails() == null) return null;

        UkIndividual ind = des.getIndividualDetails().getIndividual();
        if (ind == null || ind.getDobs() == null) return null;

        return ind.getDobs().getDobs();
    }

    private Object extractAddresses(UkDesignation des) {

        if (des.getAddresses() == null) return null;

        return des.getAddresses().getAddresses().stream()
                .map(UkAddress::buildFullAddress)
                .filter(Objects::nonNull)
                .toList();
    }
}