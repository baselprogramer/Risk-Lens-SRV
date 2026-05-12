package com.sdn.blacklist.xml.ofac;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;


@XmlAccessorType(XmlAccessType.FIELD)
public class OfacDob {
      private static final String OFAC_NS =
        "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/XML";

         @XmlElement(name = "uid", namespace = OFAC_NS)
    private Long uid;

    @XmlElement(name = "dateOfBirth",  namespace = OFAC_NS)
    private String dateOfBirth;

    @XmlElement(name = "mainEntry" , namespace = OFAC_NS) 
    private Boolean mainEntry;

    public Long getUid() { return uid; }
    public String getDateOfBirth() { return dateOfBirth; }
    public Boolean getMainEntry() {
    return mainEntry;
}

}