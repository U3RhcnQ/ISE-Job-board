package com.example.isejobsboard.controller;

import com.example.isejobsboard.model.GreetingMessage;
import com.example.isejobsboard.repository.GreetingMessageRepository;
import com.example.isejobsboard.security.SHA256;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.sql.*;

import java.util.List;
import java.util.Map;
import com.example.isejobsboard.controller.schemas.*;
import com.example.isejobsboard.security.Authenticator;

@RestController
@RequestMapping("/api/v1")
public class ApiController {
    private static final Map<String, String> env = System.getenv();

    /*
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
            dbMessage = messages.get(0).getContent();
        }
        return Map.of("message", "Hello from Spring Boot Backend! and: " + dbMessage);
    }
     */

    @PostMapping("/login")
    public String login(@RequestBody UserLogin body) {
        StringBuilder queryBuilder = new StringBuilder();

        queryBuilder.append("SELECT * FROM users WHERE email='");
        queryBuilder.append(body.email);
        queryBuilder.append("';");

        String dynamic_salt = body.email;
        String static_salt = "892225800";
        String hashedPassword = SHA256.hash(dynamic_salt + body.password + static_salt);

        String query = queryBuilder.toString();

        try {
            Connection userConnection = DriverManager.getConnection(
                    "jdbc:mysql://isejobsboard.petr.ie:3306/jobs_board",
                    env.get("dbUsername"),
                    env.get("dbPassword")
            );

            Statement userStatement = userConnection.createStatement();
            ResultSet userResultSet = userStatement.executeQuery(query);

            while (userResultSet.next()) {
                if (userResultSet.getString("email").equals(body.email) && hashedPassword.equals(userResultSet.getString("password"))) {
                    return Authenticator.createToken(userResultSet.getInt("user_id"));
                }
            }

            return "404";
        } catch (SQLException e) {
            e.printStackTrace();
            return "500";
        }
    }
    @PostMapping("add-company")
    public void addCompany(@RequestBody Company body){
        StringBuilder queryBuilder = new StringBuilder();
        queryBuilder.append("INSERT INTO company (name, website, champion) VALUES(");
        queryBuilder.append(body.getName() +" ");
        queryBuilder.append(body.getWebsite() +" ");
        queryBuilder.append(body.getChampion() +" ");

        String query = queryBuilder.toString();

        try{
        Connection userConnection = DriverManager.getConnection(
                "jdbc:mysql://isejobsboard.petr.ie:3306/jobs_board",
                username,
                password

        );
        Statement userStatement = userConnection.createStatement();
        ResultSet userResultSet = userStatement.executeQuery(query);
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }

    }

    @PostMapping("/logout")
    public int logout(@RequestBody UserLogout user) {
        String token = user.getToken();

        try {
            if (Authenticator.isTokenValid(token)) {
                Authenticator.destroyToken(token);
                return 200;
            } else {
                return 401;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return 500;
        }
    }

    @PostMapping("/signup")
    public int signup(@RequestBody UserSignup user) {
        StringBuilder queryBuilder = new StringBuilder();

        String dynamic_salt = user.email;
        String static_salt = "892225800";
        String hashedPassword = SHA256.hash(dynamic_salt + user.password + static_salt);

        queryBuilder.append("INSERT INTO users (email, password) VALUES ('");
        queryBuilder.append(user.email);
        queryBuilder.append("', '");
        queryBuilder.append(hashedPassword);
        queryBuilder.append("');");

        String query = queryBuilder.toString();

        try {
            Connection userConnection = DriverManager.getConnection(
                    "jdbc:mysql://isejobsboard.petr.ie:3306/jobs_board",
                    env.get("dbUsername"),
                    env.get("dbPassword")
            );

            Statement userStatement = userConnection.createStatement();
            userStatement.executeUpdate(query);

            return 200;
        } catch (SQLException e) {
            e.printStackTrace();
            return 500;
        }
    }
}