package com.sdn.blacklist.xml.uk;

import java.util.List;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;

@XmlAccessorType(XmlAccessType.FIELD)
public class UkAddressBlock {

    @XmlElement(name = "Address")
    private List<UkAddress> addresses;

    public List<UkAddress> getAddresses() {
        return addresses;
    }
}