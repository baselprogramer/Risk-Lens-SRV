package com.sdn.blacklist.xml.uk;

import java.util.List;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;

@XmlRootElement(name = "Designations")
@XmlAccessorType(XmlAccessType.FIELD)
public class UkSanctionsRoot {

    @XmlElement(name = "Designation")
    private List<UkDesignation> designations;

    public List<UkDesignation> getDesignations() {
        return designations;
    }
}