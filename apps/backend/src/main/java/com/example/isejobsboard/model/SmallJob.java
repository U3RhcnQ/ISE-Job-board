package com.example.isejobsboard.model;

public class SmallJob {
    private String jobTitle;
    private String companyName;
    private String smallDescription;
    private float salary;
    private String residency;

    public SmallJob(String jobTitle, String companyName, String smallDescription, float salary, String residency) {
        this.jobTitle = jobTitle;
        this.companyName = companyName;
        this.smallDescription = smallDescription;
        this.salary = salary;
        this.residency = residency;
    }
}
