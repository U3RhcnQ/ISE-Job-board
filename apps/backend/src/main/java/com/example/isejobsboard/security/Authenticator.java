package com.example.isejobsboard.security;

import com.example.isejobsboard.ResultSetPrinter;
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

        long currentTime = System.currentTimeMillis();

        String query = "INSERT INTO login_sessions (user_id, token, expiry) VALUES (?, ?, ?)";

        // Inserting our token into the database
        try (Connection con = DriverManager.getConnection("jdbc:mysql://isejobsboard.petr.ie:3306/jobs_board", env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement statement = con.prepareStatement(query)) {

            statement.setInt(1, userId);
            statement.setString(2, token);
            statement.setTimestamp(3, new Timestamp(currentTime + (3 * 60 * 60 * 1000)));

            statement.executeUpdate();

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

        String query = "DELETE FROM login_sessions WHERE token = ?";

        // Deleting our token from the database
        try {
            PreparedStatement tokenStatement = tokenConnection.prepareStatement(query);

            tokenStatement.setString(1, token);

            tokenStatement.executeUpdate();
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
        String query = "SELECT * FROM login_sessions WHERE token = ?";

        try (Connection con = DriverManager.getConnection("jdbc:mysql://isejobsboard.petr.ie:3306/jobs_board", env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
        PreparedStatement statement = con.prepareStatement(query)) {

            statement.setString(1, token);

            ResultSet rs = statement.executeQuery();

            while (rs.next()) {
                if (rs.getTimestamp("expiry").after(new Timestamp(System.currentTimeMillis()))) {
                    if (rs.getString("token").equals(token)) {
                        return true;
                    }
                } else {
                    destroyToken(token);
                }
            }

            return false;
        }
    }

    public static int getUserIdFromToken(String token) throws SQLException {
        // Assume token is validated when called, we're all reasonable people here
        try (Connection con = DriverManager.getConnection("jdbc:mysql://isejobsboard.petr.ie:3306/jobs_board", env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement statement = con.prepareStatement("SELECT user_id FROM login_sessions WHERE token = ?");) {

            statement.setString(1, token);

            ResultSet rs = statement.executeQuery();

            if (rs.next()) {
                return rs.getInt("user_id");
            }
        }

        return -1;
    }

    public static String getAccessLevel(String token) throws SQLException {
        return getAccessLevel(getUserIdFromToken(token));
    }

    public static String getAccessLevel(int id) throws SQLException {

        String query =
                "SELECT 'admins' AS table_name FROM admins WHERE user_id = ? " +
                        "UNION ALL " +
                        "SELECT 'students' AS table_name FROM student WHERE user_id = ? " +
                        "UNION ALL " +
                        "SELECT 'rep' AS table_name FROM rep WHERE user_id = ?;";

        String userId = Integer.toString(id);

        System.out.println(userId);

        if (userId.equals("-1")) {
            throw new SQLException("Invalid token");
        }

        try (Connection connection = DriverManager.getConnection("jdbc:mysql://isejobsboard.petr.ie:3306/jobs_board",
                env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement statement = connection.prepareStatement(query)) {

            statement.setString(1, userId);
            statement.setString(2, userId);
            statement.setString(3, userId);

            try (ResultSet rs = statement.executeQuery()) {

                if (rs.next()) {
                    String table = rs.getString("table_name");

                    switch (table) {
                        case "students":
                            return "student";
                        case "admins":
                            return "admin";
                        case "rep":
                            return "rep";
                    }
                } else {
                    // token somehow vanished
                    throw new SQLException("Token not found in any access level.");
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return "";
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
