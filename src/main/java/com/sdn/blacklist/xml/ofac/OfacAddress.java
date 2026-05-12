package com.sdn.blacklist.xml.ofac;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;

@XmlAccessorType(XmlAccessType.FIELD)
public class OfacAddress {

    private static final String OFAC_NS =
        "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/XML";

    @XmlElement(name = "uid", namespace = OFAC_NS)
    private Long uid;

    @XmlElement(name = "address1", namespace = OFAC_NS)
    private String address1;

    @XmlElement(name = "city", namespace = OFAC_NS)
    private String city;

    @XmlElement(name = "postalCode", namespace = OFAC_NS)
    private String postalCode;

    @XmlElement(name = "country", namespace = OFAC_NS)
    private String country;

    public Long getUid() { return uid; }
    public String getAddress1() { return address1; }
    public String getCity() { return city; }
    public String getPostalCode() { return postalCode; }
    public String getCountry() { return country; }
}
