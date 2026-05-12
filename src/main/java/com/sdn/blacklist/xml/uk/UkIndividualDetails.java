package com.sdn.blacklist.xml.uk;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;

@XmlAccessorType(XmlAccessType.FIELD)
public class UkIndividualDetails {

    @XmlElement(name = "Individual")
    private UkIndividual individual;

    public UkIndividual getIndividual() {
        return individual;
    }
}