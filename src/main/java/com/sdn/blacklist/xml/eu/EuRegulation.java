package com.sdn.blacklist.xml.eu;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlAttribute;

@XmlAccessorType(XmlAccessType.FIELD)
public class EuRegulation {

    @XmlAttribute(name = "programme")
    private String programme;

    public String getProgramme() {
        return programme;
    }
}