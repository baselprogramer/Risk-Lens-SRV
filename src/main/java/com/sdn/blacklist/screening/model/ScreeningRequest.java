package com.sdn.blacklist.screening.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.sdn.blacklist.user.entity.User;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;

@Entity
public class ScreeningRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ══════════════════════════════════════════
    //  IDENTITY — الحقول الأساسية (كانت موجودة)
    // ══════════════════════════════════════════

    private String fullName;        // الاسم الكامل بالإنجليزي — PRIMARY identifier

    private String fullNameAr;      // الاسم الكامل بالعربي

    private String country;         // كود البلد

    // ══════════════════════════════════════════
    //  KYC CONFIRMING FACTORS
    //  هاي الحقول لا تُستخدم للبحث الأولي
    //  بس تُستخدم لتأكيد أو نفي المطابقة بعد ما
    //  يجي match بالاسم من Elasticsearch
    // ══════════════════════════════════════════

    private String nationality;         // جنسية العميل: SY, IQ, JO...

    private LocalDate dob;              // تاريخ الميلاد

    private String idType;              // NATIONAL_ID | PASSPORT | RESIDENCE

    @Column(name = "id_number")
    private String idNumber;            // رقم الوثيقة

    private LocalDate idExpiry;         // تاريخ انتهاء الوثيقة

    private String motherName;          // اسم الأم — مفيد جداً للأسماء العربية المتشابهة

    private String phone;               // رقم الهاتف

    private String address;             // العنوان

    // ══════════════════════════════════════════
    //  SYSTEM
    // ══════════════════════════════════════════

    @Enumerated(EnumType.STRING)
    private ScreeningStatus status;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @OneToOne(mappedBy = "request", cascade = CascadeType.ALL)
    @JsonManagedReference
    private ScreeningResult result;

    @Column(name = "tenant_id")
    private Long tenantId;

    @Column(name = "branch_id")
    private Long branchId;

    // ══════════════════════════════════════════
    //  Constructors
    // ══════════════════════════════════════════

    public ScreeningRequest() {}

    // Constructor بسيط — للتوافق مع الكود القديم
    public ScreeningRequest(String fullName, String country) {
        this.fullName  = fullName;
        this.country   = country;
        this.status    = ScreeningStatus.PENDING;
        this.createdAt = LocalDateTime.now();
    }

    // Constructor كامل مع KYC
    public ScreeningRequest(String fullName, String fullNameAr, String country,
                             String nationality, LocalDate dob,
                             String idType, String idNumber) {
        this.fullName    = fullName;
        this.fullNameAr  = fullNameAr;
        this.country     = country;
        this.nationality = nationality;
        this.dob         = dob;
        this.idType      = idType;
        this.idNumber    = idNumber;
        this.status      = ScreeningStatus.PENDING;
        this.createdAt   = LocalDateTime.now();
    }

    // ══════════════════════════════════════════
    //  Helper — هل عندنا بيانات كافية للـ confirming
    // ══════════════════════════════════════════

    public boolean hasConfirmingData() {
        return dob != null
            || (idNumber    != null && !idNumber.isBlank())
            || (nationality != null && !nationality.isBlank());
    }

    // ══════════════════════════════════════════
    //  Getters & Setters
    // ══════════════════════════════════════════

    public Long getId()                             { return id; }
    public void setId(Long id)                      { this.id = id; }

    public String getFullName()                     { return fullName; }
    public void setFullName(String fullName)        { this.fullName = fullName; }

    public String getFullNameAr()                   { return fullNameAr; }
    public void setFullNameAr(String v)             { this.fullNameAr = v; }

    public String getCountry()                      { return country; }
    public void setCountry(String country)          { this.country = country; }

    public String getNationality()                  { return nationality; }
    public void setNationality(String v)            { this.nationality = v; }

    public LocalDate getDob()                       { return dob; }
    public void setDob(LocalDate v)                 { this.dob = v; }

    public String getIdType()                       { return idType; }
    public void setIdType(String v)                 { this.idType = v; }

    public String getIdNumber()                     { return idNumber; }
    public void setIdNumber(String v)               { this.idNumber = v; }

    public LocalDate getIdExpiry()                  { return idExpiry; }
    public void setIdExpiry(LocalDate v)            { this.idExpiry = v; }

    public String getMotherName()                   { return motherName; }
    public void setMotherName(String v)             { this.motherName = v; }

    public String getPhone()                        { return phone; }
    public void setPhone(String v)                  { this.phone = v; }

    public String getAddress()                      { return address; }
    public void setAddress(String v)                { this.address = v; }

    public ScreeningStatus getStatus()              { return status; }
    public void setStatus(ScreeningStatus s)        { this.status = s; }

    public LocalDateTime getCreatedAt()             { return createdAt; }
    public void setCreatedAt(LocalDateTime t)       { this.createdAt = t; }

    public User getCreatedBy()                      { return createdBy; }
    public void setCreatedBy(User u)                { this.createdBy = u; }

    public ScreeningResult getResult()              { return result; }
    public void setResult(ScreeningResult r)        { this.result = r; }

    public Long getTenantId()                       { return tenantId; }
    public void setTenantId(Long tenantId)          { this.tenantId = tenantId; }

    public Long getBranchId()                       { return branchId; }
    public void setBranchId(Long branchId)          { this.branchId = branchId; }
}