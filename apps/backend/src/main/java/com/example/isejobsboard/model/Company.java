package com.example.isejobsboard.model;

import jakarta.persistence.*;

@Entity
@Table(name = "Company")
public class Company {

    @Id // Denotes the primary key field.
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Configures how the ID is generated (e.g., auto-increment in the DB).
    private Long id;
    private String name;
    private String website;

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
        return Champion;
    }

    public void setChampion(String champion) {
        Champion = champion;
    }

    private String Champion;

    public Company(){

    }
    public Company(Long id, String name, String website, String Champion){

    }
}
