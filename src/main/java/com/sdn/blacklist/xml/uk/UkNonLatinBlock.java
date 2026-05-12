package com.sdn.blacklist.xml.uk;

import java.util.List;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;

@XmlAccessorType(XmlAccessType.FIELD)
public class UkNonLatinBlock {

    @XmlElement(name = "NonLatinName")
    private List<UkNonLatinName> nonLatinNames;

    public List<UkNonLatinName> getNonLatinNames() {
        return nonLatinNames;
    }
}