package com.sdn.blacklist.xml.uk;


import java.util.List;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;

@XmlAccessorType(XmlAccessType.FIELD)
public class DobBlock {

    @XmlElement(name = "DOB")
    private List<String> dobs;

    public List<String> getDobs() {
        return dobs;
    }
}