package com.example.isejobsboard.controller.schemas;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public class Student extends User implements Comparable<Student> {

    public int studentNumber;
    public Integer rank;
    public ArrayList<Job> jobPreferences;
    public HashMap<Long, Job> availableJobs;
    public ArrayList<Job> interviews;
    public String year;

    private static final Map<String, String> env = System.getenv();


    public Student(Long userId, String firstName, String lastName, String email,int studentNumber, String year) {
        super(userId, firstName, lastName, email);
        this.studentNumber = studentNumber;
        this.year = year;
    }

    public Student(int studentNumber, int rank, HashMap<Long, Job> availableJobs)throws SQLException{
        super(null,null,null,null);//information not need for interview allocation
        this.studentNumber = studentNumber;
        this.rank = rank;
        this.availableJobs = availableJobs;
        this.interviews = new ArrayList<Job>();
        this.jobPreferences = new ArrayList<>();
        getStudentPreferences();
    }

    public static String getYear(String token) throws SQLException{
        //quary that looks for the year of the associated student user with the session token
        String sql = "SELECT s.year " +
                "FROM student s "+
        "JOIN login_sessions ls ON s.user_id = ls.user_id " +
                "WHERE ls.token = ? AND ls.expiry > NOW()";


        try (Connection connection = DriverManager.getConnection("jdbc:mysql://isejobsboard.petr.ie:3306/jobs_board",
                env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setString(1, token);

            try (ResultSet rs = statement.executeQuery()) {

                if (rs.next()) {
                    return rs.getString("year");
                } else {
                    // token somehow vanished
                    throw new SQLException("Token not found for any student.");
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
            throw new SQLException();
        }
    }
    public static int getStudentNumber(String token)throws SQLException{

        String sql = "SELECT s.student_number " +
                "FROM student s " +
                "JOIN login_sessions ls ON s.user_id = ls.user_id " +
                "WHERE ls.token = ? AND ls.expiry > NOW()";

        try (Connection connection = DriverManager.getConnection("jdbc:mysql://isejobsboard.petr.ie:3306/jobs_board",
                env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setString(1, token);

            try (ResultSet rs = statement.executeQuery()) {

                if (rs.next()) {
                    return rs.getInt("student_number");
                } else {
                    // token somehow vanished
                    throw new SQLException("Student doesn't exist");
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
            throw new SQLException();
        }
    }

    /**
     *
     * @throws SQLException
     * <p>used for assigning students job preferences</p>
     */
    public void getStudentPreferences()throws SQLException{
        //prepared statement to prevent sql injections
        String sql =("SELECT job_id, preference " +
                "FROM student_preference " +
                "WHERE student_number = ? " +
                "ORDER BY preference ASC");
        try (Connection connection = DriverManager.getConnection("jdbc:mysql://isejobsboard.petr.ie:3306/jobs_board",
                env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setInt(1, this.studentNumber);

            try (ResultSet rs = statement.executeQuery()) {//execute query
               //for  every result set the preference of each job and making references to the common job pool
                while (rs.next()) {
                    System.out.println(availableJobs.get(rs.getLong("job_id")));
                    this.jobPreferences.add(availableJobs.get(rs.getLong("job_id")));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
            throw new SQLException();
        }
    }


    public boolean hasCompany(Job possiableJob){
        for(int i = 0; i < this.interviews.size(); i++){
            //check all the current allocated interview companys for the new possible job
            if(this.interviews.get(i).getCompanyId().equals(possiableJob.getCompanyId())){
                return true;
            }
        }
        return false;
    }
    @Override
    public int compareTo(Student other){
        return (Integer)this.rank.compareTo(rank.compareTo(other.rank));
    }
}
