package com.sdn.blacklist.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonAutoDetect.Visibility;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@JsonAutoDetect(fieldVisibility = Visibility.ANY)
@Entity
@Table(name = "sanction")
public class SanctionEntity {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "uid")
    private Long ofacUid;

    @Column(name = "external_id")
    private String externalId;

    @Column(columnDefinition = "text")
    private String name;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "program", columnDefinition = "jsonb")
    private Object program;

    @Column(columnDefinition = "text")
    private String sdnType;

    @Column(columnDefinition = "text")
    private String source;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "date_of_birth", columnDefinition = "jsonb")
    private Object dateOfBirth;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "addresses", columnDefinition = "jsonb")
    private Object addresses;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "aliases", columnDefinition = "jsonb")
    private Object aliases;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ids", columnDefinition = "jsonb")
    private Object ids;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "nationality", columnDefinition = "jsonb")
    private Object nationality;

    @Column(name = "raw_data", columnDefinition = "text")
    private String rawData;

    private Boolean active = true;

    private LocalDateTime lastSyncedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "data_id")
    private Long dataId;

    @Column(name = "translated_name")
    private String translatedName;

    // ===== JSON Safe Helper =====
    private static final ObjectMapper JSON_MAPPER = new ObjectMapper();

    private static Object toJsonSafe(Object value) {
        if (value == null) return null;
        try {
            return JSON_MAPPER.writeValueAsString(value);
        } catch (Exception e) {
            return "\"" + value.toString().replace("\"", "\\\"") + "\"";
        }
    }

    // ===== Protected Constructor for JPA =====
    public SanctionEntity() {}

    // ===== Main Constructor =====
    public SanctionEntity(
            String name,
            String source,
            Object program,
            Long ofacUid,
            String sdnType,
            String rawData,
            Object aliases,
            Object addresses,
            Object nationality,
            Object ids,
            Object dateOfBirth
    ) {
        this.name = name;
        this.source = source;
        this.program = toJsonSafe(program);
        this.ofacUid = ofacUid;
        this.sdnType = sdnType;
        this.rawData = rawData;
        this.aliases = toJsonSafe(aliases);
        this.addresses = toJsonSafe(addresses);
        this.nationality = toJsonSafe(nationality);
        this.ids = toJsonSafe(ids);
        this.dateOfBirth = toJsonSafe(dateOfBirth);
        this.active = true;
        this.lastSyncedAt = LocalDateTime.now();
    }

    // ===== Getters =====
    public Long getId()                { return ofacUid; }
    public UUID getUuid()              { return id; }
    public String getName()            { return name; }
    public String getSource()          { return source; }
    public Long getOfacUid()           { return ofacUid; }
    public String getType()            { return sdnType; }
    public Boolean getActive()         { return active; }
    public Object getCountry()         { return nationality; }
    public Object getAliases()         { return aliases; }
    public String getExternalId()      { return externalId; }
    public String getTranslatedName()  { return translatedName; }

    //  KYC Getters — مطلوبة لـ extractSanctionData بالـ ScreeningService
    public Object getDateOfBirth()     { return dateOfBirth; }
    public Object getIds()             { return ids; }

    // ===== Setters =====
    public void setName(String name)                       { this.name = name; }
    public void setSource(String source)                   { this.source = source; }
    public void setOfacUid(Long ofacUid)                   { this.ofacUid = ofacUid; }
    public void setExternalId(String externalId)           { this.externalId = externalId; }
    public void setProgram(Object program)                 { this.program = toJsonSafe(program); }
    public void setSdnType(String sdnType)                 { this.sdnType = sdnType; }
    public void setAliases(Object aliases)                 { this.aliases = toJsonSafe(aliases); }
    public void setAddresses(Object addresses)             { this.addresses = toJsonSafe(addresses); }
    public void setNationality(Object nationality)         { this.nationality = toJsonSafe(nationality); }
    public void setIds(Object ids)                         { this.ids = toJsonSafe(ids); }
    public void setDateOfBirth(Object dateOfBirth)         { this.dateOfBirth = toJsonSafe(dateOfBirth); }
    public void setRawData(String rawData)                 { this.rawData = rawData; }
    public void setActive(Boolean active)                  { this.active = active; }
    public void setLastSyncedAt(LocalDateTime lastSyncedAt){ this.lastSyncedAt = lastSyncedAt; }
    public void setTranslatedName(String translatedName)   { this.translatedName = translatedName; }
}