package com.example.isejobsboard.controller.schemas;

import java.sql.*;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public class InterviewAllocation {
    private static final Map<String, String> env = System.getenv();
    private ArrayList<Student> studentRanking;
    private final String year;
    private HashMap<Long,Job> availableJobs;
    private String residency;

    public InterviewAllocation(String year, String residency)throws SQLException{
        this.year = year;
        this.residency = residency;
        this.studentRanking = new ArrayList<>();

        try {
            switch (this.residency){
                case "r1":
                    availableJobs = Job.getJobs("r1");
                    availableJobs.putAll(Job.getJobs("r1+r2"));
                    break;
                default:
                    availableJobs = Job.getJobs(this.residency);
            }
            System.out.println(availableJobs);
        } catch (SQLException e) {
            e.printStackTrace();
            throw new SQLException();
        }
        String sql = "SELECT student_number, class_rank " +
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
                    int rank = rs.getInt("class_rank");
                    this.studentRanking.add(new Student(student_number, rank, this.availableJobs));
                }
                Collections.sort(this.studentRanking);
            }
            //if a query fails or connection fails
        } catch (SQLException e) {
            e.printStackTrace();
            throw new SQLException();
        }
        allocate();
//        for(Student student: studentRanking) {
//            System.out.println(student.studentNumber);
//            for(Job job: student.interviews){
//               System.out.println(job.getJobId());
//            }
//        }
    }
    public void allocate()throws SQLException{
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
        String sql = "INSERT INTO interview_allocation " +
                "(student_number, job_id) VALUES (?, ?)";
        //automatic resource allocation
        try (Connection connection = DriverManager.getConnection("jdbc:mysql://isejobsboard.petr.ie:3306/jobs_board",
                env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement statement = connection.prepareStatement(sql)) {
            for(Student student: this.studentRanking){
                for (Job jobInterview: student.interviews){
                    statement.setInt(1, student.studentNumber);
                    statement.setLong(2, jobInterview.getJobId());
                    statement.executeUpdate();
                }
            }
            //safely set the statement
            statement.setString(1, year);

            //if a query fails or connection fails
        } catch (SQLException e) {
            e.printStackTrace();
            throw new SQLException();
        }

    }

}
