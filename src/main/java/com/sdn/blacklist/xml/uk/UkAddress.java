package com.sdn.blacklist.xml.uk;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;

@XmlAccessorType(XmlAccessType.FIELD)
public class UkAddress {

    @XmlElement(name = "AddressLine1")
    private String addressLine1;

    @XmlElement(name = "AddressLine6")
    private String addressLine6;

    @XmlElement(name = "AddressCountry")
    private String addressCountry;

    public String buildFullAddress() {
        return (addressLine1 != null ? addressLine1 + ", " : "")
                + (addressLine6 != null ? addressLine6 + ", " : "")
                + (addressCountry != null ? addressCountry : "");
    }
}
