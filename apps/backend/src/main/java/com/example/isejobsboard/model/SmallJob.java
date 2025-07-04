package com.example.isejobsboard.model;

import java.sql.Timestamp;

public class SmallJob {
    private Long jobId;
    private String jobTitle;
    private String companyName;
    private String smallDescription;
    private float salary;
    private String residency;
    private String approval;
    private Timestamp postDate;
    public int positionCount;

    public SmallJob(Long jobId, String jobTitle, String companyName, String smallDescription,
                    float salary, String residency, String approval, Timestamp postDate, int positionCount) {
        this.jobId = jobId;
        this.jobTitle = jobTitle;
        this.companyName = companyName;
        this.smallDescription = smallDescription;
        this.salary = salary;
        this.residency = residency;
        this.approval = approval;
        this.postDate = postDate;
        this.positionCount = positionCount;
    }

    public SmallJob(Long jobId, String jobTitle, String companyName, String smallDescription,
                    float salary, String residency, Timestamp postDate, int positionCount, String approval ) {
        this.jobId = jobId;
        this.jobTitle = jobTitle;
        this.companyName = companyName;
        this.smallDescription = smallDescription;
        this.salary = salary;
        this.residency = residency;
        this.postDate = postDate;
        this.positionCount = positionCount;
        this.approval = approval;

    }

    public SmallJob(Long jobId, String jobTitle, String companyName, String smallDescription,
                    float salary, String residency, Timestamp postDate, int positionCount) {
        this.jobId = jobId;
        this.jobTitle = jobTitle;
        this.companyName = companyName;
        this.smallDescription = smallDescription;
        this.salary = salary;
        this.residency = residency;
        this.postDate = postDate;
        this.positionCount = positionCount;

    }
    public Long getJobId(){
        return this.jobId;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public String getCompanyName() {
        return companyName;
    }

    public String getSmallDescription() {
        return smallDescription;
    }

    public float getSalary() {
        return salary;
    }

    public String getResidency() {
        return residency;
    }

    public String getApproval() {
        return approval;
    }
    public Timestamp getPostDate(){
        return this.postDate;
    }
}
