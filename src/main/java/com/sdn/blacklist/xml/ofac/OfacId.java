package com.sdn.blacklist.xml.ofac;


import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;

@XmlAccessorType(XmlAccessType.FIELD)
public class OfacId {
    private static final String OFAC_NS =
        "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/XML";

         @XmlElement(name = "uid", namespace = OFAC_NS)
    private Long uid;

    @XmlElement(name = "idType", namespace = OFAC_NS)
    private String idType;

    @XmlElement(name = "idNumber" , namespace = OFAC_NS )
    private String idNumber;

     public Long getUid() { return uid; }
    public String getIdType() { return idType; }
    public String getIdNumber() { return idNumber; }
}
