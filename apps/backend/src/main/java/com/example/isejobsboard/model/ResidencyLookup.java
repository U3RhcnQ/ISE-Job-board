package com.example.isejobsboard.model;
//
//import jakarta.persistence.*;
//
//import java.util.HashSet;
//import java.util.Set;
//
//@Entity
//@Table(name = "residency_lookup")
//public class ResidencyLookup {
//
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY) // Assuming residency_id in lookup is auto-incremented
//    @Column(name = "residency_id")
//    private Long id; // Maps to residency_id PK in DB
//
//    @Column(name = "title", length = 45)
//    private String title;
//
//    @Column(name = "year") // TINYINT in ERD
//    private Integer year;
//
//    // One lookup type can be associated with multiple residency instances
//    @OneToMany(mappedBy = "residencyType", fetch = FetchType.LAZY)
//    private Set<Residency> residencyInstances = new HashSet<>();
//
//
//    // Constructors
//    public ResidencyLookup() {
//    }
//
//    public ResidencyLookup(String title, Integer year) {
//        this.title = title;
//        this.year = year;
//    }
//
//    // Getters and Setters
//    public Long getId() {
//        return id;
//    }
//
//    public void setId(Long id) {
//        this.id = id;
//    }
//
//    public String getTitle() {
//        return title;
//    }
//
//    public void setTitle(String title) {
//        this.title = title;
//    }
//
//    public Integer getYear() {
//        return year;
//    }
//
//    public void setYear(Integer year) {
//        this.year = year;
//    }
//
//    public Set<Residency> getResidencyInstances() {
//        return residencyInstances;
//    }
//
//    public void setResidencyInstances(Set<Residency> residencyInstances) {
//        this.residencyInstances = residencyInstances;
//    }
//    // Add equals() and hashCode() methods
//}
