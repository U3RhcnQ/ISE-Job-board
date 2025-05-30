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

    public SmallJob(Long jobId, String jobTitle, String companyName, String smallDescription,
                    float salary, String residency, String approval, Timestamp postDate) {
        this.jobId = jobId;
        this.jobTitle = jobTitle;
        this.companyName = companyName;
        this.smallDescription = smallDescription;
        this.salary = salary;
        this.residency = residency;
        this.approval = approval;
        this.postDate = postDate;
    }

    public SmallJob(Long jobId, String jobTitle, String companyName, String smallDescription,
                    float salary, String residency, Timestamp postDate ) {
        this.jobId = jobId;
        this.jobTitle = jobTitle;
        this.companyName = companyName;
        this.smallDescription = smallDescription;
        this.salary = salary;
        this.residency = residency;
        this.postDate = postDate;

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
