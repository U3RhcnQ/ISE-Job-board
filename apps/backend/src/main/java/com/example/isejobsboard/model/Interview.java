package com.example.isejobsboard.model;

import org.springframework.http.ResponseEntity;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public class Interview {
    public Long studentNumber;
    public String studentFirstName;
    public String studentLastName;
    public Long jobId;
    public String jobTitle;

    private static final Map<String, String> env = System.getenv();
    private final String dbUrl = "jdbc:mysql://isejobsboard.petr.ie:3306/jobs_board";

    public Interview(Long studentNumber, String studentFirstName, String studentLastName, Long jobId, String jobTitle) {
        this.studentNumber = studentNumber;
        this.studentFirstName = studentFirstName;
        this.studentLastName = studentLastName;
        this.jobId = jobId;
        this.jobTitle = jobTitle;
    }

    public static ArrayList<Interview> getInterviews(String residency) throws SQLException{
        ArrayList<Interview> interviewList = new ArrayList<>();
        String sql = "SELECT s.student_number, u.first_name, u.last_name, j.job_id, j.job_title " +
                     "FROM interview_allocation ia " +
                     "JOIN student s ON ia.student_number = s.student_number " +
                     "JOIN users u ON s.user_id = u.user_id " +
                     "JOIN job j ON ia.job_id = j.job_id " +
                     "WHERE (";

        switch (residency){
            case "r1":
                sql += "(j.residency = 'r1' OR j.residency = 'r1+r2') AND s.year = 1";
                break;
            case "r2":
                sql += "j.residency = 'r2' AND s.year = 1";
                break;
            case "r3":
                sql += "j.residency = 'r3' AND s.year = 2";
                break;
            case "r4":
                sql += "j.residency = 'r4' AND s.year = 3";
                break;
            case "r5":
                sql += "j.residency = 'r5' AND s.year = 4";
                break;
            default:
                // Handle unsupported residency or throw an exception
                System.err.println("Unsupported residency: " + residency);
                return interviewList; // Return empty list or throw an exception
        }
        sql += ")";

        // You'll need to establish a database connection and execute this query.
        // This example assumes you have a 'connection' object available.

        try (Connection connection = DriverManager.getConnection("jdbc:mysql://isejobsboard.petr.ie:3306/jobs_board",
                env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement statement = connection.prepareStatement(sql)) {
            try (ResultSet resultSet = statement.executeQuery()) {

                while (resultSet.next()) {
                    Long studentNumber = resultSet.getLong("student_number");
                    String firstName = resultSet.getString("first_name");
                    String lastName = resultSet.getString("last_name");
                    Long jobId = resultSet.getLong("job_id");
                    String jobTitle = resultSet.getString("job_title");

                    interviewList.add(new Interview(studentNumber, firstName, lastName, jobId, jobTitle));
                }
            }
            return interviewList;
        } catch (SQLException e) {
            e.printStackTrace();
            throw new SQLException();
        }

    }
}
// while (resultSet.next()) {
//                Long studentNumber = resultSet.getLong("student_number");
//                String firstName = resultSet.getString("first_name");
//                String lastName = resultSet.getString("last_name");
//                Long jobId = resultSet.getLong("job_id");
//                String jobTitle = resultSet.getString("job_title");
//
//                interviewList.add(new Interview(studentNumber, firstName, lastName, jobId, jobTitle));
//            }

// return interviewList;
