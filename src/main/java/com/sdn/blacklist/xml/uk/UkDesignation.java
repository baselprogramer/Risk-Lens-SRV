package com.sdn.blacklist.xml.uk;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;

@XmlAccessorType(XmlAccessType.FIELD)
public class UkDesignation {

    @XmlElement(name = "LastUpdated")
    private String lastUpdated;

    @XmlElement(name = "DateDesignated")
    private String dateDesignated;

    @XmlElement(name = "UniqueID")
    private String uniqueId;

    @XmlElement(name = "OFSIGroupID")
    private String ofsiGroupId;

    @XmlElement(name = "UNReferenceNumber")
    private String unReferenceNumber;

    @XmlElement(name = "Names")
    private UkNameBlock names;

    @XmlElement(name = "NonLatinNames")
    private UkNonLatinBlock nonLatinNames;

    @XmlElement(name = "RegimeName")
    private String regimeName;

    @XmlElement(name = "IndividualEntityShip")
    private String individualEntityShip;

    @XmlElement(name = "DesignationSource")
    private String designationSource;

    @XmlElement(name = "SanctionsImposed")
    private String sanctionsImposed;


    @XmlElement(name = "OtherInformation")
    private String otherInformation;

    @XmlElement(name = "IndividualDetails")
    private UkIndividualDetails individualDetails;

    @XmlElement(name = "Addresses")
    private UkAddressBlock addresses;

    // ============================
    // GETTERS & SETTERS
    // ============================

    public String getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(String lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    public String getDateDesignated() {
        return dateDesignated;
    }

    public void setDateDesignated(String dateDesignated) {
        this.dateDesignated = dateDesignated;
    }

    public String getUniqueId() {
        return uniqueId;
    }

    public void setUniqueId(String uniqueId) {
        this.uniqueId = uniqueId;
    }

    public String getOfsiGroupId() {
        return ofsiGroupId;
    }

    public void setOfsiGroupId(String ofsiGroupId) {
        this.ofsiGroupId = ofsiGroupId;
    }

    public String getUnReferenceNumber() {
        return unReferenceNumber;
    }

    public void setUnReferenceNumber(String unReferenceNumber) {
        this.unReferenceNumber = unReferenceNumber;
    }

    public UkNameBlock getNames() {
        return names;
    }

    public void setNames(UkNameBlock names) {
        this.names = names;
    }

    public UkNonLatinBlock getNonLatinNames() {
        return nonLatinNames;
    }

    public void setNonLatinNames(UkNonLatinBlock nonLatinNames) {
        this.nonLatinNames = nonLatinNames;
    }

    public String getRegimeName() {
        return regimeName;
    }

    public void setRegimeName(String regimeName) {
        this.regimeName = regimeName;
    }

    public String getIndividualEntityShip() {
        return individualEntityShip;
    }

    public void setIndividualEntityShip(String individualEntityShip) {
        this.individualEntityShip = individualEntityShip;
    }

    public String getDesignationSource() {
        return designationSource;
    }

    public void setDesignationSource(String designationSource) {
        this.designationSource = designationSource;
    }

    public String getSanctionsImposed() {
        return sanctionsImposed;
    }

    public void setSanctionsImposed(String sanctionsImposed) {
        this.sanctionsImposed = sanctionsImposed;
    }


    public String getOtherInformation() {
        return otherInformation;
    }

    public void setOtherInformation(String otherInformation) {
        this.otherInformation = otherInformation;
    }

    public UkIndividualDetails getIndividualDetails() {
        return individualDetails;
    }

    public void setIndividualDetails(UkIndividualDetails individualDetails) {
        this.individualDetails = individualDetails;
    }

    public UkAddressBlock getAddresses() {
        return addresses;
    }

    public void setAddresses(UkAddressBlock addresses) {
        this.addresses = addresses;
    }
}