package com.sdn.blacklist.xml.uk;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;

@XmlAccessorType(XmlAccessType.FIELD)
public class UkName {

    @XmlElement(name = "Name1")
    private String name1;

    @XmlElement(name = "Name2")
    private String name2;

    @XmlElement(name = "Name6")
    private String name6;

    @XmlElement(name = "NameType")
    private String nameType;

    public String buildFullName() {
        StringBuilder sb = new StringBuilder();
        if (name1 != null) sb.append(name1).append(" ");
        if (name2 != null) sb.append(name2).append(" ");
        if (name6 != null) sb.append(name6);
        return sb.toString().trim();
    }

    public String getNameType() { return nameType; }
}