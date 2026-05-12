package com.sdn.blacklist.xml.un;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;

@XmlAccessorType(XmlAccessType.FIELD)
public class UnEntityAddress {

    @XmlElement(name = "STREET")
    private String street;

    @XmlElement(name = "COUNTRY")
    private String country;

    public String getStreet() {
        return street;
    }

    public String getCountry() {
        return country;
    }
}
