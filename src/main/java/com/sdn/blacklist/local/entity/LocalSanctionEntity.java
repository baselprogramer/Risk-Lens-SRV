package com.sdn.blacklist.local.entity;

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
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

@Entity
@Table(name = "local_sanction")
public class LocalSanctionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;
    
    @Column(name = "aliases", columnDefinition = "text")
    private String aliases;

    private static final ObjectMapper mapper = new ObjectMapper();
    
    @Transient
    public JsonNode getAliasesAsJson() {
        if (aliases == null || aliases.isEmpty()) {
            return null;
        }
        try {
            return mapper.readTree(aliases);
        } catch (Exception e) {
            return null;
        }
    }
    
    public void setAliasesFromJson(JsonNode jsonNode) {
        if (jsonNode == null) {
            this.aliases = null;
            return;
        }
        try {
            this.aliases = mapper.writeValueAsString(jsonNode);
        } catch (Exception e) {
            this.aliases = null;
        }
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

public String getTranslatedName() {
    return translatedName;
}

public void setTranslatedName(String translatedName) {
    this.translatedName = translatedName;
}
   

    // ===== Getter & Setter =====

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAliases() {
        return aliases;
    }
    
    public void setAliases(String aliases) {
        this.aliases = aliases;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getNationality() {
        return nationality;
    }

    public void setNationality(String nationality) {
        this.nationality = nationality;
    }

    public String getRequestedBy() {
        return requestedBy;
    }

    public void setRequestedBy(String requestedBy) {
        this.requestedBy = requestedBy;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    
}