package com.example.isejobsboard.controller.schemas;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public class interviewAllocation {
    private static final Map<String, String> env = System.getenv();
    private ArrayList<Student> studentRanking;
    private final String year;
    private HashMap<Long,Job> availableJobs;
    private String residency;

    public interviewAllocation(String year, String residency)throws SQLException{
        this.year = year;
        this.residency = residency;

        try {
            switch (this.residency){
                case "r1":
                    availableJobs = Job.getJobs("r1");
                    availableJobs.putAll(Job.getJobs("r1+r2"));
                    break;
                default:
                    availableJobs = Job.getJobs(this.residency);
            }
        } catch (SQLException e) {
            e.printStackTrace();
            throw new SQLException();
        }
        String sql = "SELECT student_number, rank " +
                "FROM student " +
                "WHERE year = ?";

        //automatic resource allocation
        try (Connection connection = DriverManager.getConnection("jdbc:mysql://isejobsboard.petr.ie:3306/jobs_board",
                env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement statement = connection.prepareStatement(sql)) {
            //safely set the statement
            statement.setString(1, year);
            try(ResultSet rs = statement.executeQuery()) {// query can fail
                while(rs.next()){
                    int student_number = rs.getInt("student_number");
                    int rank = rs.getInt("rank");
                    this.studentRanking.add(rank, new Student(student_number,rank, this.availableJobs));
                }
            }
            //if a query fails or connection fails
        } catch (SQLException e) {
            e.printStackTrace();
            throw new SQLException();
        }
    }
    public void allocate(){
        for(Student student : this.studentRanking){
            for(Job preferedJob : student.jobPreferences){
                if (student.interviews.size() == 3){
                    break;
                }
                if(preferedJob.interviews.size() < preferedJob.getPositionCount()*3 &! student.hasCompany(preferedJob)){
                    preferedJob.interviews.add(student);
                    student.interviews.add(preferedJob);
                }
            }
        }
    }

}
