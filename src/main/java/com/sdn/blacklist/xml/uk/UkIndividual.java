package com.sdn.blacklist.xml.uk;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;

@XmlAccessorType(XmlAccessType.FIELD)
public class UkIndividual {

  @XmlElement(name = "DOBs")
    private DobBlock dobs;

    @XmlElement(name = "Nationalities")
    private UkNationalityBlock nationalities;

    public UkNationalityBlock getNationalities() {
        return nationalities;
    }

    public DobBlock getDobs() {
        return dobs;
    }
}
