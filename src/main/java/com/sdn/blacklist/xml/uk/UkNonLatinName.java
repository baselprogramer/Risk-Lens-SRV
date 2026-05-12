package com.sdn.blacklist.xml.uk;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;

@XmlAccessorType(XmlAccessType.FIELD)
public class UkNonLatinName {

    @XmlElement(name = "NameNonLatinScript")
    private String nameNonLatinScript;

    public String getNameNonLatinScript() {
        return nameNonLatinScript;
    }
}
