package com.sdn.blacklist.xml.eu;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlAttribute;
import jakarta.xml.bind.annotation.XmlType;

@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(namespace = "http://eu.europa.ec/fpi/fsd/export")

public class EuNameAlias {

    @XmlAttribute(name = "wholeName")
    private String wholeName;

    @XmlAttribute(name = "strong")
    private Boolean strong;

    public String getWholeName() { return wholeName; }
    public Boolean getStrong() { return strong; }
}