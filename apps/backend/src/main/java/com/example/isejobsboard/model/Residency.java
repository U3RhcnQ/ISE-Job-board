package com.example.isejobsboard.model;
//
//
//import jakarta.persistence.*;
//
//import java.time.LocalDate;
//import java.util.HashSet;
//import java.util.Set;
//
//@Entity
//@Table(name = "residency")
//public class Residency {
//
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY) // Assuming residency_id in residency table is auto-incremented
//    @Column(name = "residency_id")
//    private Long id; // Maps to residency_id PK in DB
//
//    // Many residency instances can share one lookup type
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "residency_lookup_id", referencedColumnName = "residency_id") // Assumed FK column name
//    private ResidencyLookup residencyType;
//
//    @Column(name = "start_date")
//    private LocalDate startDate;
//
//    @Column(name = "end_date")
//    private LocalDate endDate;
//
//    // One residency status can apply to multiple jobs
//    @OneToMany(mappedBy = "residency", fetch = FetchType.LAZY)
//    private Set<Job> jobs = new HashSet<>();
//
//    // Constructors
//    public Residency() {
//    }
//
//    public Residency(ResidencyLookup residencyType, LocalDate startDate, LocalDate endDate) {
//        this.residencyType = residencyType;
//        this.startDate = startDate;
//        this.endDate = endDate;
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
//    public ResidencyLookup getResidencyType() {
//        return residencyType;
//    }
//
//    public void setResidencyType(ResidencyLookup residencyType) {
//        this.residencyType = residencyType;
//    }
//
//    public LocalDate getStartDate() {
//        return startDate;
//    }
//
//    public void setStartDate(LocalDate startDate) {
//        this.startDate = startDate;
//    }
//
//    public LocalDate getEndDate() {
//        return endDate;
//    }
//
//    public void setEndDate(LocalDate endDate) {
//        this.endDate = endDate;
//    }
//
//    public Set<Job> getJobs() {
//        return jobs;
//    }
//
//    public void setJobs(Set<Job> jobs) {
//        this.jobs = jobs;
//    }
//    // Add equals() and hashCode() methods
//}