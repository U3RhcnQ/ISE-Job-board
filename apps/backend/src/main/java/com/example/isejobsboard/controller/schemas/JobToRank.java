package com.example.isejobsboard.controller.schemas;

public class JobToRank {
    public String jobTitle;
    public Long jobId;
    public String companyName;

    public JobToRank(String jobTitle, Long jobId, String companyName) {
        this.jobTitle = jobTitle;
        this.jobId = jobId;
        this.companyName = companyName;
    }
}
