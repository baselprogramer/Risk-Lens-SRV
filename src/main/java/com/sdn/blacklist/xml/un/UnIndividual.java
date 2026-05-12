package com.sdn.blacklist.xml.un;

import java.util.List;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;

@XmlAccessorType(XmlAccessType.FIELD)
public class UnIndividual {

    @XmlElement(name = "DATAID")
    private Long dataId;

    @XmlElement(name = "FIRST_NAME")
    private String firstName;

    @XmlElement(name = "SECOND_NAME")
    private String secondName;

    @XmlElement(name = "REFERENCE_NUMBER")
    private String referenceNumber;

    @XmlElement(name = "UN_LIST_TYPE")
    private String unListType;

    @XmlElement(name = "LISTED_ON")
    private String listedOn;

    @XmlElement(name = "GENDER")
    private String gender;

    @XmlElement(name = "COMMENTS1")
    private String comments;

    @XmlElement(name = "INDIVIDUAL_ALIAS")
    private List<UnIndividualAlias> aliases;

    @XmlElement(name = "NATIONALITY")
    private List<UnNationality> nationalities;

    @XmlElement(name = "INDIVIDUAL_DATE_OF_BIRTH")
    private List<UnDateOfBirth> datesOfBirth;

    // ===== Getters =====

    public Long getDataId() {
        return dataId;
    }

    public String getFullName() {
        return (firstName + " " + secondName).trim();
    }

    public String getReferenceNumber() {
        return referenceNumber;
    }

    public String getUnListType() {
        return unListType;
    }

    public List<UnIndividualAlias> getAliases() {
        return aliases;
    }

    public List<UnNationality> getNationalities() {
        return nationalities;
    }

    public List<UnDateOfBirth> getDatesOfBirth() {
        return datesOfBirth;
    }

    public String getComments() {
       return comments;
    }
}
