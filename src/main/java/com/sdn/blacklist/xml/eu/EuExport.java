package com.sdn.blacklist.xml.eu;

import java.util.List;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;


@XmlRootElement(name = "export", namespace = "http://eu.europa.ec/fpi/fsd/export")
@XmlAccessorType(XmlAccessType.FIELD)
public class EuExport {

    @XmlElement(name = "sanctionEntity", namespace = "http://eu.europa.ec/fpi/fsd/export")
    private List<EuSanctionEntity> sanctionEntities;

    public List<EuSanctionEntity> getSanctionEntities() {
        return sanctionEntities;
    }

    public void setSanctionEntities(List<EuSanctionEntity> sanctionEntities) {
        this.sanctionEntities = sanctionEntities;
    }
}

  

