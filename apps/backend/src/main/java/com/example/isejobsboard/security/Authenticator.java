package com.example.isejobsboard.security;

import java.security.SecureRandom;
import java.sql.*;
import java.util.Base64;

public class Authenticator {
    public Authenticator() {}

    /**
     * Creates a session token for a user in the database.
     * @param userId
     * @throws SQLException
     */
    public void createToken(int userId) throws SQLException {
        String token = _buildToken();

        // Connecting to the database table
        Connection tokenConnection = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/login_sessions",
                "root",
                ""
        );

        StringBuilder queryBuilder = new StringBuilder();

        // Using StringBuilder because concatenation was throwing a syntax error
        queryBuilder.append("INSERT INTO login_sessions(user_id, token) VALUES (");
        queryBuilder.append(Integer.toString(userId));
        queryBuilder.append(", '");
        queryBuilder.append(token);
        queryBuilder.append("');");

        String query = queryBuilder.toString();

        // Inserting our token into the database
        try {
            Statement tokenStatement = tokenConnection.createStatement();
            tokenStatement.executeQuery(query);
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Removes the session token from the database.
     * @param token
     * @throws SQLException
     */
    public void destroyToken(String token) throws SQLException {
        // Connecting to the database table
        Connection tokenConnection = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/login_sessions",
                "root",
                ""
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
            tokenStatement.executeQuery(query);
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
    public boolean isTokenValid(String token) throws SQLException {
        Connection tokensConnection = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/login_sessions",
                "root",
                ""
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
                if (tokensResultSet.getString("token").equals(token)) {
                    return true;
                }
            }

            return false;
        } catch (RuntimeException e) {
            throw new SQLException(e);
        }
    }

    /**
     * Builds a cryptographically random token which can be used for user authentication.
     */
    private String _buildToken() {
        SecureRandom random = new SecureRandom();
        Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();

        byte[] tokenBytes = new byte[256];

        // Filling array with cryptographically random bytes
        random.nextBytes(tokenBytes);

        String encodedTokenBytes = encoder.encodeToString(tokenBytes);

        return encodedTokenBytes;
    }
}
