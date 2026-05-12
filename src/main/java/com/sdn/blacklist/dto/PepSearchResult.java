package com.sdn.blacklist.dto;

import java.util.List;

public class PepSearchResult {

    private String id;
    private String name;
    private List<String> birthDate;
    private List<String> country;
    private List<String> topics;
    private List<String> datasets;
    private boolean target;

    public PepSearchResult(String id,
                           String name,
                           List<String> birthDate,
                           List<String> country,
                           List<String> topics,
                           List<String> datasets,
                           boolean target) {
        this.id = id;
        this.name = name;
        this.birthDate = birthDate;
        this.country = country;
        this.topics = topics;
        this.datasets = datasets;
        this.target = target;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public List<String> getBirthDate() { return birthDate; }
    public List<String> getCountry() { return country; }
    public List<String> getTopics() { return topics; }
    public List<String> getDatasets() { return datasets; }
    public boolean isTarget() { return target; }
}