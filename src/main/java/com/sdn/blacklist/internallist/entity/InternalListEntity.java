package com.sdn.blacklist.internallist.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

@Entity
@Table(name = "internal_list", indexes = {
        @Index(name = "idx_internal_list_tenant", columnList = "tenant_id"),
        @Index(name = "idx_internal_list_tenant_active", columnList = "tenant_id, active")
})
public class InternalListEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // ── العزل بين الشركات ── كل سجل مربوط بالـ tenant تبع الشركة
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(nullable = false)
    private String name;

    @Column(name = "aliases", columnDefinition = "text")
    private String aliases;

    private static final ObjectMapper mapper = new ObjectMapper();

    @Transient
    public JsonNode getAliasesAsJson() {
        if (aliases == null || aliases.isEmpty()) return null;
        try { return mapper.readTree(aliases); } catch (Exception e) { return null; }
    }

    public void setAliasesFromJson(JsonNode jsonNode) {
        if (jsonNode == null) { this.aliases = null; return; }
        try { this.aliases = mapper.writeValueAsString(jsonNode); } catch (Exception e) { this.aliases = null; }
    }

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "nationality", length = 100)
    private String nationality;

    @Column(name = "requested_by", length = 255)
    private String requestedBy;

    private String note;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "translated_name")
    private String translatedName;

    @Column(name = "mother_name", length = 150)
    private String motherName;

    @Column(name = "id_number", length = 100)
    private String idNumber;

    @Column(name = "issuing_authority", length = 255)
    private String issuingAuthority;

    @Column(name = "additional_info", columnDefinition = "text")
    private String additionalInfo;

    @Column(name = "entity_type", length = 100)
    private String entityType;

    @Column(name = "commercial_reg_no", length = 100)
    private String commercialRegNo;

    @Column(name = "active")
    private Boolean active = true;

    // PERSON or ENTITY
    @Column(name = "record_type", length = 20)
    private String recordType = "PERSON";

    // ===== Getters & Setters =====

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Long getTenantId() { return tenantId; }
    public void setTenantId(Long tenantId) { this.tenantId = tenantId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAliases() { return aliases; }
    public void setAliases(String aliases) { this.aliases = aliases; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getNationality() { return nationality; }
    public void setNationality(String nationality) { this.nationality = nationality; }

    public String getRequestedBy() { return requestedBy; }
    public void setRequestedBy(String requestedBy) { this.requestedBy = requestedBy; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getTranslatedName() { return translatedName; }
    public void setTranslatedName(String translatedName) { this.translatedName = translatedName; }

    public String getMotherName() { return motherName; }
    public void setMotherName(String motherName) { this.motherName = motherName; }

    public String getIdNumber() { return idNumber; }
    public void setIdNumber(String idNumber) { this.idNumber = idNumber; }

    public String getIssuingAuthority() { return issuingAuthority; }
    public void setIssuingAuthority(String issuingAuthority) { this.issuingAuthority = issuingAuthority; }

    public String getAdditionalInfo() { return additionalInfo; }
    public void setAdditionalInfo(String additionalInfo) { this.additionalInfo = additionalInfo; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public String getCommercialRegNo() { return commercialRegNo; }
    public void setCommercialRegNo(String commercialRegNo) { this.commercialRegNo = commercialRegNo; }

    public String getRecordType() { return recordType; }
    public void setRecordType(String recordType) { this.recordType = recordType; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}