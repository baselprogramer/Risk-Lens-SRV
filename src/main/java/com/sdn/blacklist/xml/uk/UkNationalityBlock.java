package com.sdn.blacklist.xml.uk;



import java.util.List;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;

@XmlAccessorType(XmlAccessType.FIELD)
public class UkNationalityBlock {

    @XmlElement(name = "Nationality")
    private List<String> nationalities;

    public List<String> getNationalities() {
        return nationalities;
    }
}