package com.example.isejobsboard.controller.schemas;

public class Company {
    private Long id;
    private String name;
    private String website;
    private String champion;

    public Company(Long id, String name, String website, String champion) {
        this.id = id;
        this.name = name;
        this.website = website;
        this.champion = champion;
    }

    public Company() {

    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public String getChampion() {
        return champion;
    }

    public void setChampion(String champion) {
        this.champion = champion;
    }
}
