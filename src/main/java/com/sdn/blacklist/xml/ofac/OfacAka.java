package com.sdn.blacklist.xml.ofac;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;

@XmlAccessorType(XmlAccessType.FIELD)
public class OfacAka {

    private static final String OFAC_NS =
        "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/XML";

    @XmlElement(name = "uid", namespace = OFAC_NS)
    private Long uid;

    @XmlElement(name = "lastName", namespace = OFAC_NS)
    private String lastName;

    @XmlElement(name = "type", namespace = OFAC_NS)
    private String type;

    @XmlElement(name = "category", namespace = OFAC_NS)
    private String category;

    public Long getUid() { return uid; }
    public String getLastName() { return lastName; }
    public String getType() { return type; }
    public String getCategory() { return category; }
}

