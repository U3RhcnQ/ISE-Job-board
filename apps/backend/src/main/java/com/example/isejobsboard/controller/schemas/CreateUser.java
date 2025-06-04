package com.example.isejobsboard.controller.schemas;

public class CreateUser {
    // User stuff
    public String userType;
    public String firstName;
    public String lastName;
    public String email;
    public String password;

    // Student stuff
    public int studentNumber;
    public int classRank;
    public int year;

    // Rep stuff
    public int rep_id;
    public int company_id;
}
