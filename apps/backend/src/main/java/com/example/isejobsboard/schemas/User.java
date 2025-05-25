package com.example.isejobsboard.schemas;

public record User(String forename, String surname, int studentId) {
    public User(String forename, String surname, int studentId) {
        this.forename = forename;
        this.surname = surname;
        this.studentId = studentId;
    }
}
