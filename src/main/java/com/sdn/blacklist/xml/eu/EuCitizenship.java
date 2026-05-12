package com.sdn.blacklist.xml.eu;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlAttribute;

@XmlAccessorType(XmlAccessType.FIELD)
public class EuCitizenship {

    @XmlAttribute(name = "countryDescription")
    private String countryDescription;

    public String getCountryDescription() {
        return countryDescription;
    }
}