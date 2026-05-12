package com.sdn.blacklist.xml.un;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;

@XmlAccessorType(XmlAccessType.FIELD)
public class UnDateOfBirth {

    @XmlElement(name = "YEAR")
    private String year;

    public String getYear() {
        return year;
    }
}
