//package com.example.isejobsboard.model;
//
//import jakarta.persistence.*;
//
//@Entity
//@Table(name = "interview_allocation", uniqueConstraints = {
//        // A student should typically only have one allocation (or ranking set) per job
//        @UniqueConstraint(columnNames = {"job_id", "student_id"})
//})
//public class InterviewAllocation {
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY) // Assuming 'id' is auto-incremented
//    @Column(name = "id")
//    private Long id;
//
//    @Column(name = "student_ranking") // TINYINT(2) in ERD
//    private Integer studentRanking;
//
//    @Column(name = "company_ranking") // TINYINT(2) in ERD
//    private Integer companyRanking;
//
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "job_id", nullable = false) // FK to Job
//    private Job job;
//
//    @ManyToOne(fetch = FetchType.LAZY)
//    // FK column in interview_allocation is 'student_id', which references 'student_number' in the 'student' table
//    @JoinColumn(name = "student_id", referencedColumnName = "student_number", nullable = false)
//    private Student student;
//
//    // Constructors
//    public InterviewAllocation() {
//    }
//
//    public InterviewAllocation(Student student, Job job, Integer studentRanking, Integer companyRanking) {
//        this.student = student;
//        this.job = job;
//        this.studentRanking = studentRanking;
//        this.companyRanking = companyRanking;
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
//    public Integer getStudentRanking() {
//        return studentRanking;
//    }
//
//    public void setStudentRanking(Integer studentRanking) {
//        this.studentRanking = studentRanking;
//    }
//
//    public Integer getCompanyRanking() {
//        return companyRanking;
//    }
//
//    public void setCompanyRanking(Integer companyRanking) {
//        this.companyRanking = companyRanking;
//    }
//
//    public Job getJob() {
//        return job;
//    }
//
//    public void setJob(Job job) {
//        this.job = job;
//    }
//
//    public Student getStudent() {
//        return student;
//    }
//
//    public void setStudent(Student student) {
//        this.student = student;
//    }
//    // Add equals() and hashCode() methods
//}
//
