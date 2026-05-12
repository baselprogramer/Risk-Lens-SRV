package com.sdn.blacklist.xml.eu;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlAttribute;

@XmlAccessorType(XmlAccessType.FIELD)
public class EuBirthdate {

    @XmlAttribute(name = "year")
    private String year;

    @XmlAttribute(name = "city")
    private String city;

    public String getYear() { return year; }
    public String getCity() { return city; }
}