package com.example.isejobsboard.model;

import java.sql.*;
import java.util.Map;

public class Student {
    private static final Map<String, String> env = System.getenv();
    public static String getYear(String token) throws SQLException{
        //quary that looks for the year of the associated student user with the session token
        String sql = "SELECT year " +
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
}
