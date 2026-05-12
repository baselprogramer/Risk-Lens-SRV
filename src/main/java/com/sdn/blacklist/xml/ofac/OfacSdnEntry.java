package com.sdn.blacklist.xml.ofac;

import java.util.List;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlElementWrapper;

@XmlAccessorType(XmlAccessType.FIELD)
public class OfacSdnEntry {

    public static final String OFAC_NS =
        "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/XML";

    @XmlElement(name = "uid", namespace = OFAC_NS)
    private Long uid;

    @XmlElement(name = "firstName", namespace = OFAC_NS)
    private String firstName;

    @XmlElement(name = "lastName", namespace = OFAC_NS)
    private String lastName;

    @XmlElement(name = "sdnType", namespace = OFAC_NS)
    private String sdnType;

    @XmlElementWrapper(name = "programList", namespace = OFAC_NS)
    @XmlElement(name = "program", namespace = OFAC_NS)
    private List<String> programs;

    @XmlElementWrapper(name = "akaList", namespace = OFAC_NS)
    @XmlElement(name = "aka", namespace = OFAC_NS)
    private List<OfacAka> akaList;

    @XmlElementWrapper(name = "addressList", namespace = OFAC_NS)
    @XmlElement(name = "address", namespace = OFAC_NS)
    private List<OfacAddress> addressList;

     @XmlElementWrapper(name = "nationalityList", namespace = OFAC_NS)
    @XmlElement(name = "nationality", namespace = OFAC_NS)
    private List<OfacNationality> nationalityList;

    @XmlElementWrapper(name = "idList", namespace = OFAC_NS)
    @XmlElement(name = "id", namespace = OFAC_NS)
    private List<OfacId> idList;

    @XmlElementWrapper(name = "dateOfBirthList", namespace = OFAC_NS)
    @XmlElement(name = "dateOfBirthItem", namespace = OFAC_NS)
    private List<OfacDob> dateOfBirthList;



    public Long getUid() { return uid; }
    public String getFirstName() {return firstName;}
    public String getLastName() { return lastName; }
    public String getSdnType() { return sdnType; }
    public List<String> getPrograms() { return programs; }
    public List<OfacAka> getAkaList() { return akaList; }
    public List<OfacAddress> getAddressList() { return addressList; }

    public List<OfacDob>getDateOfBirthList() { return dateOfBirthList;}
     public List<OfacId> getIdList() { return idList;}
    public List<OfacNationality> getNationalityList() { return nationalityList;}

   
   


}
