package com.sdn.blacklist.xml.un;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;

@XmlAccessorType(XmlAccessType.FIELD)
public class UnNationality {

    @XmlElement(name = "VALUE")
    private String value;

    public String getValue() {
        return value;
    }
}
