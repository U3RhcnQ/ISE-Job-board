package com.example.isejobsboard.controller.schemas;

public class User  {
   public Long userId;
   public String firstName;
   public String lastName;
   public String email;

    public User(Long userId, String firstName, String lastName, String email) {
        this.userId = userId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
    }
}
