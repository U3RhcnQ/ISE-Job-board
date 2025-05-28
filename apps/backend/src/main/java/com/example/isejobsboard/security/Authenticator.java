package com.example.isejobsboard.security;

import org.springframework.http.ResponseEntity;

import java.security.SecureRandom;
import java.sql.*;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

public class Authenticator {
    private static final Map<String, String> env = System.getenv();

    /**
     * Creates a session token for a user in the database.
     * @param userId
     * @throws SQLException
     */
    public static String createToken(int userId) throws SQLException {
        String token = _buildToken();

        // Connecting to the database table
        Connection tokenConnection = DriverManager.getConnection(
                "jdbc:mysql://isejobsboard.petr.ie:3306/jobs_board",
                env.get("MYSQL_USER_NAME"),
                env.get("MYSQL_USER_PASSWORD")
        );

        StringBuilder queryBuilder = new StringBuilder();

        long currentTime = System.currentTimeMillis();

        // Using StringBuilder because concatenation was throwing a syntax error
        queryBuilder.append("INSERT INTO login_sessions(user_id, token, expiry) VALUES (");
        queryBuilder.append(Integer.toString(userId));
        queryBuilder.append(", '");
        queryBuilder.append(token);
        queryBuilder.append("', '");
        queryBuilder.append(new Timestamp(currentTime + (3 * 60 * 60 * 1000)));
        queryBuilder.append("');");;

        String query = queryBuilder.toString();

        // Inserting our token into the database
        try {
            Statement tokenStatement = tokenConnection.createStatement();
            tokenStatement.executeUpdate(query);

            return token;
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Removes the session token from the database.
     * @param token
     * @throws SQLException
     */
    public static void destroyToken(String token) throws SQLException {
        // Connecting to the database table
        Connection tokenConnection = DriverManager.getConnection(
                "jdbc:mysql://isejobsboard.petr.ie:3306/jobs_board",
                env.get("MYSQL_USER_NAME"),
                env.get("MYSQL_USER_PASSWORD")
        );

        StringBuilder queryBuilder = new StringBuilder();

        // Using StringBuilder because concatenation was throwing a syntax error
        queryBuilder.append("DELETE FROM login_sessions WHERE token = '");
        queryBuilder.append(token);
        queryBuilder.append("';");

        String query = queryBuilder.toString();

        // Deleting our token from the database
        try {
            Statement tokenStatement = tokenConnection.createStatement();
            tokenStatement.executeUpdate(query);
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Checks if a session token is a valid session token.
     * @param token
     * @return
     * @throws SQLException
     */
    public static boolean isTokenValid(String token) throws SQLException {
        Connection tokensConnection = DriverManager.getConnection(
                "jdbc:mysql://isejobsboard.petr.ie:3306/jobs_board",
                env.get("MYSQL_USER_NAME"),
                env.get("MYSQL_USER_PASSWORD")
        );

        StringBuilder queryBuilder = new StringBuilder();

        queryBuilder.append("SELECT * FROM login_sessions WHERE token = '");
        queryBuilder.append(token);
        queryBuilder.append("';");

        String query = queryBuilder.toString();

        try {
            Statement tokensStatement = tokensConnection.createStatement();
            ResultSet tokensResultSet = tokensStatement.executeQuery(query);

            while (tokensResultSet.next()) {
                if (tokensResultSet.getTimestamp("expiry").after(new Timestamp(System.currentTimeMillis()))) {
                    if (tokensResultSet.getString("token").equals(token)) {
                        return true;
                    }
                } else {
                    destroyToken(token);
                }
            }

            return false;
        } catch (RuntimeException e) {
            throw new SQLException(e);
        }
    }

    public static String getAccessLevel(String token) throws SQLException {

        String sql = "SELECT u.user_id" +
                "FROM users u " +
                "JOIN login_sessions ls ON u.user_id = ls.user_id " +
                "WHERE ls.token = ? AND ls.expiry > NOW()";

        try (Connection connection = DriverManager.getConnection("jdbc:mysql://isejobsboard.petr.ie:3306/jobs_board",
                env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setString(1, token);

            try (ResultSet rs = statement.executeQuery()) {
                if (rs.next()) {
                    // Token is valid and we found the user
                    String id = Integer.toString(rs.getInt("user_id"));
                    if(isStudent(id)){
                        return "student";
                    }
                    if(isRep(id)){
                        return "rep";
                    }
                    if(isAdmin(id)){
                        return "admin";
                    }

                } else {
                    // Token is invalid, expired, or doesn't exist
                    return "";
                }
            }
        } catch (RuntimeException e) {
            throw new SQLException();
        }
        return "";
    }
    public static boolean isStudent(String id)throws SQLException{
        String sql = "SELECT user_id" +
                "FROM student" +
                "WHERE user_id = ?";
        try (Connection connection = DriverManager.getConnection("jdbc:mysql://isejobsboard.petr.ie:3306/jobs_board",
                env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setString(1, id);

            try (ResultSet rs = statement.executeQuery()) {
                if (rs.next()) {
                    // The user is a student
                    return true;


                } else {
                    // The user isn't a student
                    return false;
                }
            }
        } catch (RuntimeException e) {
            throw new SQLException();
        }

    }
    public static boolean isRep(String id)throws SQLException{
        String sql = "SELECT user_id" +
                "FROM rep" +
                "WHERE user_id = ?";
        try (Connection connection = DriverManager.getConnection("jdbc:mysql://isejobsboard.petr.ie:3306/jobs_board",
                env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setString(1, id);

            try (ResultSet rs = statement.executeQuery()) {
                if (rs.next()) {
                    // The user is a rep
                    return true;

                } else {
                    // The user isn't a rep
                    return false;
                }
            }
        } catch (RuntimeException e) {
            throw new SQLException();
        }

    }
    public static boolean isAdmin(String id)throws SQLException{
        String sql = "SELECT user_id" +
                "FROM admin" +
                "WHERE user_id = ?";
        try (Connection connection = DriverManager.getConnection("jdbc:mysql://isejobsboard.petr.ie:3306/jobs_board",
                env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setString(1, id);

            try (ResultSet rs = statement.executeQuery()) {
                if (rs.next()) {
                    // The user is a admin
                    return true;

                } else {
                    // The user isn't a admin
                    return false;
                }
            }
        } catch (RuntimeException e) {
            throw new SQLException();
        }

    }




    /**
     * Builds a cryptographically random token which can be used for user authentication.
     */
    private static String _buildToken() {
        SecureRandom random = new SecureRandom();
        Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();

        byte[] tokenBytes = new byte[256];

        // Filling array with cryptographically random bytes
        random.nextBytes(tokenBytes);

        String encodedTokenBytes = encoder.encodeToString(tokenBytes);

        return encodedTokenBytes;
    }
}
