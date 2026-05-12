package com.sdn.blacklist.xml.un;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;

@XmlAccessorType(XmlAccessType.FIELD)
public class UnIndividualAlias {

    @XmlElement(name = "ALIAS_NAME")
    private String aliasName;

    public String getAliasName() {
        return aliasName;
    }
}
