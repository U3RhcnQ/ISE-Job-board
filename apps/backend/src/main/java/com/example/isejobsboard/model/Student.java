package com.example.isejobsboard.model;

import jakarta.persistence.*;

import java.util.ArrayList;
@Entity // Indicates that this class is a JPA entity.
@Table(name = "students") // Specifies the database table to which this entity is mapped.
public class Student {


    @Id // Denotes the primary key field.
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Configures how the ID is generated (e.g., auto-increment in the DB).
    private Long id;

    @Column(name = "student_id_number", nullable = false, unique = true) // Defines a column in the table.
    private String studentIdNumber; // Unique student identification number, e.g., "S1001"

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "email", nullable = false, unique = true)
    private String email;


    // Constructors
    public Student() {
        // JPA requires a no-argument constructor
    }

    public Student(String studentIdNumber, String firstName, String lastName, String email ) {
        this.studentIdNumber = studentIdNumber;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStudentIdNumber() {
        return studentIdNumber;
    }

    public void setStudentIdNumber(String studentIdNumber) {
        this.studentIdNumber = studentIdNumber;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }


    //ArrayList<Job> preferences;//stores student preferences for allocation
    //ArrayList<Job> interviewAllocation;//stores students allocated interviews


}
