package com.example.isejobsboard.controller.schemas;

import com.example.isejobsboard.model.Student;

import java.sql.*;
import java.util.ArrayList;
import java.util.Map;

public class StudentPreference {
    private int jobId;
    public int preference;

    private static final Map<String, String> env = System.getenv();
    public StudentPreference(int jobId, int preference){
        this.jobId = jobId;
        this.preference = preference;
    }

    public static void setStudentPreference(ArrayList<StudentPreference> studentPreferences, String token)throws SQLException{
        String insert_sql =
                "INSERT INTO `student_preference` (`student_number`, `job_id`, `preference`) VALUES (?, ?, ?)" +
                        "ON DUPLICATE KEY UPDATE " +
                        "preference = VALUES(preference);";
        String year;
        int studentNumber;
        ArrayList<String> residency = new ArrayList<>();
        try {
            year = Student.getYear(token);
            studentNumber = Student.getStudentNumber(token);
            //for every job check if the year of the student is associated with the job
            //if so insert the job preference
            //use the token to derive the student id, not takeing any chance


        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
        //used to check the associated residency of the students year
        switch(year){
            case "1":
                residency.add("r1");
                residency.add("r2");
                residency.add("r1+r2");
                break;
            case "2":
                residency.add("r3");
                break;
            case "3":
                residency.add("r4");
                break;
            case "4":
                residency.add("r5");
                break;
        }

        try (Connection connection = DriverManager.getConnection("jdbc:mysql://isejobsboard.petr.ie:3306/jobs_board",
                env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement statement = connection.prepareStatement(insert_sql)) {
            for(StudentPreference studentPreference: studentPreferences){
                String jobResidency = Job.getResidency(studentPreference.jobId);
                if(!residency.contains(jobResidency)){
                    throw new SQLException("job preference isn't associated with the right year group");
                }
                statement.setInt(1, studentNumber);
                statement.setInt(2, studentPreference.jobId);
                statement.setInt(3, studentPreference.preference);

                statement.executeUpdate();

            }

        } catch (SQLException e) {
            e.printStackTrace();
            throw new SQLException();
        }

        for(StudentPreference studentPreference: studentPreferences){
            String jobResidency = Job.getResidency(studentPreference.jobId);
            if(!residency.contains(jobResidency)){
                throw new SQLException();
            }


        }

    }
}
