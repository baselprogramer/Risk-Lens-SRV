package com.sdn.blacklist.xml.uk;

import java.util.List;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;

@XmlAccessorType(XmlAccessType.FIELD)
public class UkNameBlock {

    @XmlElement(name = "Name")
    private List<UkName> names;

    public List<UkName> getNames() {
        return names;
    }
}
