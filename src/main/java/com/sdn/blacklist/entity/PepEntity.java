package com.sdn.blacklist.entity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "pep")
public class PepEntity {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID id; // Primary key

    @Column(unique = true)
    private String externalId; 

    @Column(columnDefinition = "text")
    private String fullName;

    @Column(columnDefinition = "text")
    private String source;

    @Column(columnDefinition = "text")
    private String country;

    @Column(columnDefinition = "text")
    private String position;

    @ElementCollection
    @Column(columnDefinition = "text")
    private List<String> aliases;

    private Boolean active = true;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public PepEntity() {}

    // Getters & Setters
    public UUID getId() { return id; }
    public String getExternalId() { return externalId; }
    public void setExternalId(String externalId) { this.externalId = externalId; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }
    public List<String> getAliases() { return aliases; }
    public void setAliases(List<String> aliases) { this.aliases = aliases; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}