package com.sdn.blacklist.xml.un;

import java.util.List;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlElementWrapper;
import jakarta.xml.bind.annotation.XmlRootElement;

@XmlRootElement(name = "CONSOLIDATED_LIST")
@XmlAccessorType(XmlAccessType.FIELD)
public class UnExport {

    @XmlElementWrapper(name = "INDIVIDUALS")
    @XmlElement(name = "INDIVIDUAL")
    private List<UnIndividual> individuals;

    @XmlElementWrapper(name = "ENTITIES")
    @XmlElement(name = "ENTITY")
    private List<UnEntity> entities;

    public List<UnIndividual> getIndividuals() {
        return individuals != null ? individuals : List.of();
    }

    public List<UnEntity> getEntities() {
        return entities != null ? entities : List.of();
    }
}


   