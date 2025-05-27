package com.example.isejobsboard.controller;

import com.example.isejobsboard.model.GreetingMessage;
import com.example.isejobsboard.repository.GreetingMessageRepository;
import com.example.isejobsboard.security.SHA256;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.*;

import java.util.List;
import java.util.Map;
import com.example.isejobsboard.controller.schemas.*;
import com.example.isejobsboard.security.Authenticator;

@RestController
@RequestMapping("/api/v1")
public class ApiController {
    private final String username = "root";
    private final String password = "AX10kl2-s(6b";
    private final String dbUrl = "jdbc:mysql://isejobsboard.petr.ie:3306/jobs_board";

    private final GreetingMessageRepository greetingMessageRepository;

    @Autowired
    public ApiController(GreetingMessageRepository greetingMessageRepository) {
        this.greetingMessageRepository = greetingMessageRepository;
    }

    @GetMapping("/greeting")
    public Map<String, String> getGreeting() {
        List<GreetingMessage> messages = greetingMessageRepository.findAll();
        String dbMessage;
        if (messages.isEmpty()) {
            // Optional: Create a default message if none exists
            GreetingMessage defaultMessage = new GreetingMessage("Hello from MySQL via Spring Boot!");
            greetingMessageRepository.save(defaultMessage);
            dbMessage = defaultMessage.getContent();
        } else {
            // Return the content of the first message found
            dbMessage = messages.getFirst().getContent();
        }
        return Map.of("message", "Hello from Spring Boot Backend! and: " + dbMessage);
    }

    @PostMapping("/login")
    public ResponseEntity<Object> login(@RequestBody UserLogin body) {

        // Use a PreparedStatement with a placeholder (?) to prevent SQL Injection !!!!
        String query = "SELECT * FROM users WHERE email = ?";

        String dynamic_salt = body.email;
        String static_salt = "892225800";
        String hashedPassword = SHA256.hash(dynamic_salt + body.password + static_salt);

        // Use try-with-resources for automatic closing of database connections
        try (Connection userConnection = DriverManager.getConnection(dbUrl, username, password);
             PreparedStatement userStatement = userConnection.prepareStatement(query)) {

            // Safely set the email parameter
            userStatement.setString(1, body.email);

            // Remember a query can fail !
            try (ResultSet userResultSet = userStatement.executeQuery()) {

                while (userResultSet.next()) {
                    if (userResultSet.getString("email").equals(body.email) && hashedPassword.equals(userResultSet.getString("password"))) {

                        String token = Authenticator.createToken(userResultSet.getInt("user_id"));
                        // Correct way to return responses !!
                        return ResponseEntity.ok(Map.of("token", token));

                    }
                }
                return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
            }

        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));

        }
    }
    @PostMapping("add-company")
    public void addCompany(@RequestBody Company body){
        StringBuilder queryBuilder = new StringBuilder();
        queryBuilder.append("INSERT INTO company (name, website, champion) VALUES(");
        queryBuilder.append(body.getName() +", ");
        queryBuilder.append(body.getWebsite() +", ");
        queryBuilder.append(body.getChampion() +", ");

        String query = queryBuilder.toString();

        try{
        Connection userConnection = DriverManager.getConnection(
               "jdbc:mysql://isejobsboard.petr.ie:3306/jobs_board",
                    env.get("dbUsername"),
                    env.get("dbPassword")
        );
        Statement userStatement = userConnection.createStatement();
        ResultSet userResultSet = userStatement.executeQuery(query);
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }

    }

    @PostMapping("/logout")
    public ResponseEntity<Object> logout(@RequestBody UserLogout user) {
        String token = user.getToken();

        try {
            if (Authenticator.isTokenValid(token)) {
                Authenticator.destroyToken(token);
                return ResponseEntity.ok(Map.of("message", "Logout successful"));
            } else {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired token"));
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred during logout."));
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<Object> signup(@RequestBody UserSignup user) {

        String dynamic_salt = user.email;
        String static_salt = "892225800";
        String hashedPassword = SHA256.hash(dynamic_salt + user.password + static_salt);

        // Use a PreparedStatement with placeholders (?) to prevent SQL Injection
        String query = "INSERT INTO users (email, password) VALUES (?, ?)";

        // Use try-with-resources for automatic resource management
        try (Connection userConnection = DriverManager.getConnection(dbUrl, username, password);
             PreparedStatement userStatement = userConnection.prepareStatement(query)) {

            // Safely set the parameters
            userStatement.setString(1, user.email);
            userStatement.setString(2, hashedPassword);

            userStatement.executeUpdate();

            // SUCCESS: User was created. Return 201 Created.
            return ResponseEntity.status(201).body(Map.of("message", "User created successfully"));

        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred during Signup."));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<Object> getUserInfo(@RequestBody User user) {
        String token = user.getToken();
        String id;
        try {
            if (Authenticator.isTokenValid(token)) {
                //SELECT * FROM users WHERE email = ?"
                String query = "SELECT * FROM current_session WHERE token = ?;";
                try (Connection userConnection = DriverManager.getConnection(dbUrl, username, password);
                     PreparedStatement userStatement = userConnection.prepareStatement(query)) {

                    // Safely set the token parameter
                    userStatement.setString(1, token);

                    // Remember a query can fail !
                    try (ResultSet userResultSet = userStatement.executeQuery()) {

                       if(userResultSet == null){
                           return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
                       }

                        id = Integer.toString(userResultSet.getInt("id"));
                    }

                } catch (SQLException e) {
                    e.printStackTrace();
                    return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));

                }
                query = "SELECT * FROM user WHERE id = ?";
                try (Connection userConnection = DriverManager.getConnection(dbUrl, username, password);
                     PreparedStatement userStatement = userConnection.prepareStatement(query)) {

                    // Safely set the token parameter
                    userStatement.setString(1, id);

                    // Remember a query can fail !
                    try (ResultSet userResultSet = userStatement.executeQuery()) {

                        if(userResultSet == null){
                            return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
                        }
                        String firstName = userResultSet.getString("first_name");
                        String secondName = userResultSet.getString("second_name");
                        String email = userResultSet.getString("email");
                        String level = userResultSet.getString("accessLevel");
                        return ResponseEntity.ok(Map.of("first_name",firstName, "second_name",secondName,"email", email,"level",level));
                    }


                } catch (SQLException e) {
                    e.printStackTrace();
                    return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));

                }
                //login_session
            } else {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired token"));
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred during logout."));
        }
    }
}