package com.example.isejobsboard.controller; // Adjusted package name

import com.example.isejobsboard.security.SHA256;
import org.springframework.web.bind.annotation.*;

import java.sql.*;
import java.util.Map;
import com.example.isejobsboard.controller.schemas.*;
import com.example.isejobsboard.security.Authenticator;

@RestController
@RequestMapping("/api/v1") // This is the base path for all endpoints in this controller
public class ApiController {

    @GetMapping("/greeting")
    public Map<String, String> getGreeting() {
        return Map.of("message", "Hello from Spring Boot Backend!");
    }

    @PostMapping("/login")
    public String login(@RequestBody UserLogin body) {
        StringBuilder queryBuilder = new StringBuilder();

        queryBuilder.append("SELECT * FROM users WHERE email=");
        queryBuilder.append(body.email);
        queryBuilder.append(";");

        String dynamic_salt = body.email;
        String static_salt = "892225800";
        String hashedPassword = SHA256.hash(dynamic_salt + body.password + static_salt);

        String query = queryBuilder.toString();

        try {
            Connection userConnection = DriverManager.getConnection(
                    "jdbc:mysql://isejobsboard.petr.ie:3306/users",
                    "jobuser",
                    "U9o8?=3LRJIu"
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
            return "500";
        }
    }

    @PostMapping("/logout")
    public int logout(UserLogout user) {
        String token = user.getToken();

        try {
            if (Authenticator.isTokenValid(token)) {
                Authenticator.destroyToken(token);
                return 200;
            } else {
                return 401;
            }
        } catch (SQLException e) {
            return 500;
        }
    }

    @PostMapping("/signup")
    public int signup(UserSignup user) {
        StringBuilder queryBuilder = new StringBuilder();

        queryBuilder.append("INSERT INTO users (email, password) VALUES ('");
        queryBuilder.append(user.email);
        queryBuilder.append("', '");
        queryBuilder.append(user.password);
        queryBuilder.append("';");

        String query = queryBuilder.toString();

        try {
            Connection userConnection = DriverManager.getConnection(
                    "jdbc:mysql://isejobsboard.petr.ie:3306/users",
                    "jobuser",
                    "U9o8?=3LRJIu"
            );

            Statement userStatement = userConnection.createStatement();
            userStatement.executeQuery(query);

            return 200;
        } catch (SQLException e) {
            return 500;
        }
    }
}

//test
