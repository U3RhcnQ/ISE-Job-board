package com.example.isejobsboard.model;

//import jakarta.persistence.*;
//
//import java.util.ArrayList;
//import java.util.HashSet;
//import java.util.Set;
//
//    @Entity
//    @Table(name = "job")
//    public class Job {
//
//        @Id
//        @GeneratedValue(strategy = GenerationType.IDENTITY) // Assuming job_id is auto-incremented
//        @Column(name = "job_id")
//        private Long jobId;
//
//        @ManyToOne(fetch = FetchType.LAZY)
//        @JoinColumn(name = "company_id", nullable = false) // company_id is FK to Company
//        private Company company;
//
//        @Column(name = "position_count") // TINYINT in ERD
//        private Integer positionCount;
//
//        @Lob // For MEDIUMTEXT
//        @Column(name = "description", columnDefinition = "MEDIUMTEXT")
//        private String description;
//
//        @Column(name = "job_title", length = 255)
//        private String jobTitle;
//
//        @ManyToOne(fetch = FetchType.LAZY)
//        @JoinColumn(name = "residency_id") // residency_id is FK to Residency
//        private Residency residency;
//
//        @Column(name = "salary") // FLOAT in ERD
//        private Float salary;
//
//        // One job can have many interview allocations
//        @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
//        private Set<InterviewAllocation> interviewAllocations = new HashSet<>();
//
//        // Constructors
//        public Job() {
//        }
//
//        // Getters and Setters
//        public Long getJobId() {
//            return jobId;
//        }
//
//        public void setJobId(Long jobId) {
//            this.jobId = jobId;
//        }
//
//        public Company getCompany() {
//            return company;
//        }
//
//        public void setCompany(Company company) {
//            this.company = company;
//        }
//
//        public Integer getPositionCount() {
//            return positionCount;
//        }
//
//        public void setPositionCount(Integer positionCount) {
//            this.positionCount = positionCount;
//        }
//
//        public String getDescription() {
//            return description;
//        }
//
//        public void setDescription(String description) {
//            this.description = description;
//        }
//
//        public String getJobTitle() {
//            return jobTitle;
//        }
//
//        public void setJobTitle(String jobTitle) {
//            this.jobTitle = jobTitle;
//        }
//
//        public Residency getResidency() {
//            return residency;
//        }
//
//        public void setResidency(Residency residency) {
//            this.residency = residency;
//        }
//
//        public Float getSalary() {
//            return salary;
//        }
//
//        public void setSalary(Float salary) {
//            this.salary = salary;
//        }
//
//        public Set<InterviewAllocation> getInterviewAllocations() {
//            return interviewAllocations;
//        }
//
//        public void setInterviewAllocations(Set<InterviewAllocation> interviewAllocations) {
//            this.interviewAllocations = interviewAllocations;
//        }
//        // Add equals() and hashCode() methods
//    }
//
