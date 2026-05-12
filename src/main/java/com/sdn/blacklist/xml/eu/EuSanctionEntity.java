package com.sdn.blacklist.xml.eu;

import java.util.List;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlAttribute;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlType;

@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(namespace = "http://eu.europa.ec/fpi/fsd/export")

public class EuSanctionEntity {

    @XmlAttribute(name = "logicalId")
    private Long logicalId;

    @XmlAttribute(name = "euReferenceNumber" )
    private String euReferenceNumber;

    @XmlElement(name = "nameAlias" , namespace = "http://eu.europa.ec/fpi/fsd/export")
    private List<EuNameAlias> nameAliases;

    @XmlElement(name = "citizenship" , namespace = "http://eu.europa.ec/fpi/fsd/export")
    private List<EuCitizenship> citizenships;

    @XmlElement(name = "birthdate" , namespace = "http://eu.europa.ec/fpi/fsd/export")
    private List<EuBirthdate> birthdates;

    @XmlElement(name = "regulation" , namespace = "http://eu.europa.ec/fpi/fsd/export")
    private EuRegulation regulation;

    public Long getLogicalId() { return logicalId; }
    public String getEuReferenceNumber() { return euReferenceNumber; }
    public List<EuNameAlias> getNameAliases() { return nameAliases; }
    public List<EuCitizenship> getCitizenships() { return citizenships; }
    public List<EuBirthdate> getBirthdates() { return birthdates; }
    public EuRegulation getRegulation() { return regulation; }
}
