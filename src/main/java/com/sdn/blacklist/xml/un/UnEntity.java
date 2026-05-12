package com.sdn.blacklist.xml.un;

import java.util.List;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;

@XmlAccessorType(XmlAccessType.FIELD)
public class UnEntity {

    @XmlElement(name = "DATAID")
    private Long dataId;

    @XmlElement(name = "FIRST_NAME")
    private String name;

    @XmlElement(name = "REFERENCE_NUMBER")
    private String referenceNumber;

    @XmlElement(name = "UN_LIST_TYPE")
    private String unListType;

    @XmlElement(name = "LISTED_ON")
    private String listedOn;

    @XmlElement(name = "COMMENTS1")
    private String comments;

    @XmlElement(name = "ENTITY_ALIAS")
    private List<UnEntityAlias> aliases;

    @XmlElement(name = "ENTITY_ADDRESS")
    private List<UnEntityAddress> addresses;

    // ===== Getters =====

    public Long getDataId() {
        return dataId;
    }

    public String getName() {
        return name;
    }

    public String getReferenceNumber() {
        return referenceNumber;
    }

    public String getUnListType() {
        return unListType;
    }

    public List<UnEntityAlias> getAliases() {
        return aliases;
    }

    public List<UnEntityAddress> getAddresses() {
        return addresses;
    }

     public String getComments() {
       return comments;
    }

    public String getListedOn(){
        return listedOn;
    }
}
