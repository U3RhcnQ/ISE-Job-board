package com.example.isejobsboard.schemas;

public record User(int user_id, String email, String forename, String surname, int user_level, String organisation) {
    public User(int user_id, String email, String forename, String surname, int user_level, String organisation) {
        this.user_id = user_id;
        this.email = email;
        this.forename = forename;
        this.surname = surname;
        this.user_level = user_level;
        this.organisation = organisation;
    }
}
