package com.sdn.blacklist.xml.ofac;

import java.util.List;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;

@XmlRootElement(
    name = "sdnList",
    namespace = OfacSdnList.OFAC_NS
)
@XmlAccessorType(XmlAccessType.FIELD)
public class OfacSdnList {

    public static final String OFAC_NS =
        "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/XML";

    @XmlElement(name = "sdnEntry", namespace = OFAC_NS)
    private List<OfacSdnEntry> sdnEntries;

    public List<OfacSdnEntry> getSdnEntries() {
        return sdnEntries;
    }
}

