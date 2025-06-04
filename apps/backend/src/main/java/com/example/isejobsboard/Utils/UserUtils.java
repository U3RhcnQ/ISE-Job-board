package com.example.isejobsboard.Utils;

import com.example.isejobsboard.controller.schemas.CreateUser;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import javax.xml.crypto.Data;
import java.sql.*;

public class UserUtils {
    public static ResponseEntity<Object> addStudent(CreateUser user) {
        String query = "INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?); " +
                "SET @last_id = LAST_INSERT_ID(); " +
                "INSERT INTO student (student_number, class_rank, user_id, year) VALUES (?, ?, @last_id, ?);";

        try (Connection con = DriverManager.getConnection(DatabaseUtils.url, DatabaseUtils.env.get("MYSQL_USER_NAME"), DatabaseUtils.env.get("MYSQL_USER_PASSWORD"));
        PreparedStatement statement = con.prepareStatement(query)) {
            statement.setString(1, user.email);
            statement.setString(2, user.password);
            statement.setString(3, user.firstName);
            statement.setString(4, user.lastName);
            statement.setInt(5, user.studentNumber);
            statement.setInt(6, user.classRank);
            statement.setInt(7, user.year);

            statement.executeUpdate();

            return ResponseEntity.ok("Student added successfully");
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Internal Server Error");
        }
    }

    public static ResponseEntity<Object> addAdmin(CreateUser user) {
        String query = "INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?); " +
                "SET @last_id = LAST_INSERT_ID(); " +
                "INSERT INTO admins (user_id) VALUES (@last_id);";

        try (Connection con = DriverManager.getConnection(DatabaseUtils.url, DatabaseUtils.env.get("MYSQL_USER_NAME"), DatabaseUtils.env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement statement = con.prepareStatement(query)) {
            statement.setString(1, user.email);
            statement.setString(2, user.password);
            statement.setString(3, user.firstName);
            statement.setString(4, user.lastName);

            statement.executeUpdate();

            return ResponseEntity.ok("Admin added successfully");
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Internal Server Error");
        }
    }

    public static ResponseEntity<Object> addRep(CreateUser user) {
        String query = "INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?); " +
                "SET @last_id = LAST_INSERT_ID(); " +
                "INSERT INTO rep (rep_id, company_id, user_id) VALUES (?, ?, @last_id);";

        try (Connection con = DriverManager.getConnection(DatabaseUtils.url, DatabaseUtils.env.get("MYSQL_USER_NAME"), DatabaseUtils.env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement statement = con.prepareStatement(query)) {
            statement.setString(1, user.email);
            statement.setString(2, user.password);
            statement.setString(3, user.firstName);
            statement.setString(4, user.lastName);
            statement.setInt(5, user.rep_id);
            statement.setInt(6, user.company_id);

            statement.executeUpdate();

            return ResponseEntity.ok("Representative added successfully");
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Internal Server Error");
        }
    }
}
