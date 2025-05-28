package com.example.isejobsboard.controller;

import com.example.isejobsboard.model.GreetingMessage;
import com.example.isejobsboard.repository.GreetingMessageRepository;
import com.example.isejobsboard.security.SHA256;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.config.annotation.web.oauth2.login.OidcBackChannelLogoutDsl;
import org.springframework.web.bind.annotation.*;

import java.sql.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.example.isejobsboard.controller.schemas.*;
import com.example.isejobsboard.security.Authenticator;

@RestController
@RequestMapping("/api/v1")
public class ApiController {

    private static final Map<String, String> env = System.getenv();

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
        try (Connection userConnection = DriverManager.getConnection(dbUrl, env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
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

    @PostMapping("/add-company")
    public ResponseEntity<Object> addCompany(@RequestBody Company company, @RequestHeader("Authorization") String authHeader) throws SQLException {
// 1. Validate the Authorization header format ("Bearer <token>")
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(400).body(Map.of("error", "Malformed Authorization header."));
        }

        // 2. Extract the token from the header
        String token = authHeader.substring(7); // "Bearer " is 7 characters

        if (!Authenticator.isTokenValid(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid Token"));
        }
        if(!Authenticator.getAccessLevel(token).equals("admin")){
            return ResponseEntity.status(401).body(Map.of("error", "Invalid Access Level"));
        }

        // Use a PreparedStatement with placeholders (?) to prevent SQL Injection
        String query = "INSERT INTO company(name, website, champion) VALUES (?, ?, ?)";

        // Use try-with-resources for automatic resource management
        try (Connection userConnection = DriverManager.getConnection(dbUrl, env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement userStatement = userConnection.prepareStatement(query)) {

            // Safely set the parameters
            userStatement.setString(1, company.getName());
            userStatement.setString(2, company.getWebsite());
            userStatement.setString(3, company.getChampion());

            userStatement.executeUpdate();

            // SUCCESS: User was created. Return 201 Created.
            return ResponseEntity.status(201).body(Map.of("message", "Company created successfully"));

        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred during Signup."));
        }
    }
    @DeleteMapping()
    public ResponseEntity<Object> deleteCompany(@RequestBody Company company, @RequestHeader("Authorization") String authHeader)throws SQLException{
        // 1. Validate the Authorization header format ("Bearer <token>")
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(400).body(Map.of("error", "Malformed Authorization header."));
        }

        // 2. Extract the token from the header
        String token = authHeader.substring(7); // "Bearer " is 7 characters

        // 3. Ensure the token is valid
        if (!Authenticator.isTokenValid(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid Token"));
        }
        // 4. Ensure the correct access level
        if(!Authenticator.getAccessLevel(token).equals("admin")){
            return ResponseEntity.status(401).body(Map.of("error", "Invalid Access Level"));
        }
        // 5. Create Queary to be proscessed
        String query = "DELETE company WHERE company_id = ?";
        try (Connection userConnection = DriverManager.getConnection(dbUrl, env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement userStatement = userConnection.prepareStatement(query)) {

            // Safely set the parameters
            userStatement.setString(1, Long.toString(company.getId()));


            userStatement.executeUpdate();

            // SUCCESS: User was created. Return 201 Created.
            return ResponseEntity.status(201).body(Map.of("message", "Company deleted successfully"));

        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred during Signup."));
        }
    }

//    @PostMapping("create-job")
//    public ResponseEntity<Object> createJob(@RequestBody Job job, @RequestHeader("Authorization")String authHeader) throws SQLException{
//        //check if the token is valid
//        //check if the user is a company
//        //get company id for job
//
//
//    }

//    @PostMapping("update-company")
//    public ResponseEntity<Object> updateCompany(@RequestBody Company company, @RequestHeader("Authorization") String authHeader)throws SQLException{
//        // 1. Validate the Authorization header format ("Bearer <token>")
//        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
//            return ResponseEntity.status(400).body(Map.of("error", "Malformed Authorization header."));
//        }
//
//        // 2. Extract the token from the header
//        String token = authHeader.substring(7); // "Bearer " is 7 characters
//
//        // 3. Ensure the token is valid
//        if (!Authenticator.isTokenValid(token)) {
//            return ResponseEntity.status(401).body(Map.of("error", "Invalid Token"));
//        }
//        // 4. Ensure the correct access level
//        if(!Authenticator.getAccessLevel(token).equals("admin")){
//            return ResponseEntity.status(401).body(Map.of("error", "Invalid Access Level"));
//        }
//        //use token id to find if its the company or admin
//        //get user id
//        //get company id that will be changed
//        //see if the token id is associatd with the company id or that the user is a admin
//        //use the passed object and change the company details
//
//
//
//    }
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
        try (Connection userConnection = DriverManager.getConnection(dbUrl, env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
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
    public ResponseEntity<Object> getUserProfile(@RequestHeader("Authorization") String authHeader) throws SQLException {

        // 1. Validate the Authorization header format ("Bearer <token>")
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(400).body(Map.of("error", "Malformed Authorization header."));
        }

        // 2. Extract the token from the header
        String token = authHeader.substring(7); // "Bearer " is 7 characters

        if (!Authenticator.isTokenValid(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid Token"));
        }

        // 3. This single query finds the user associated with a valid, non-expired token
        String sql = "SELECT u.user_id, u.first_name, u.last_name, u.email, u.access_level " +
                "FROM users u " +
                "JOIN login_sessions ls ON u.user_id = ls.user_id " +
                "WHERE ls.token = ? AND ls.expiry > NOW()";

        try (Connection connection = DriverManager.getConnection(dbUrl,
                env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setString(1, token);

            try (ResultSet rs = statement.executeQuery()) {
                if (rs.next()) {
                    // Token is valid and we found the user
                    Map<String, Object> userData = new HashMap<>();

                    userData.put("user_id", rs.getInt("user_id"));
                    userData.put("first_name", rs.getString("first_name"));
                    userData.put("last_name", rs.getString("last_name"));
                    userData.put("email", rs.getString("email"));
                    userData.put("access_level", rs.getString("access_level"));

                    return ResponseEntity.ok(userData);
                } else {
                    // Token is invalid, expired, or doesn't exist
                    return ResponseEntity.status(401).body(Map.of("error", "Unauthorized: Invalid or expired token."));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
        }
    }
}
