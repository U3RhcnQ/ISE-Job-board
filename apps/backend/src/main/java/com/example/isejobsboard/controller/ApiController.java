package com.example.isejobsboard.controller;

import com.example.isejobsboard.Utils.CompanyUtils;
import com.example.isejobsboard.Utils.DatabaseUtils;
import com.example.isejobsboard.Utils.JobUtils;
import com.example.isejobsboard.controller.schemas.*;
import com.example.isejobsboard.model.GreetingMessage;
import com.example.isejobsboard.model.Interview;
import com.example.isejobsboard.model.SmallJob;
import com.example.isejobsboard.controller.schemas.Student;
import com.example.isejobsboard.repository.GreetingMessageRepository;
import com.example.isejobsboard.security.Authenticator;
import com.example.isejobsboard.security.SHA256;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.isejobsboard.Utils.UserUtils;

import java.sql.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/v1")
public class ApiController {

    private static final Map<String, String> env = DatabaseUtils.env;

    private final String dbUrl = DatabaseUtils.url;

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
    @DeleteMapping("/delete-company")
    public ResponseEntity<Object> deleteCompany(@RequestHeader("Authorization") String authHeader, @RequestParam int companyId){
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(400).body(Map.of("error", "Malformed Authorization header."));
        }
        String token = authHeader.substring(7);

        try {
            if (Authenticator.getAccessLevel(token).equals("admin")) {
                String sql = "DELETE FROM company WHERE company_id = ?";
                try (Connection connection = DriverManager.getConnection(dbUrl,
                        env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
                     PreparedStatement statement = connection.prepareStatement(sql)) {
                    statement.setInt(1, companyId);
                    statement.executeUpdate();
                    return ResponseEntity.ok(Map.of("message", "Company deleted"));
                }
            } else {
                return ResponseEntity.status(401).body(Map.of("error", "You are not an admin."));
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred during logout."));
        }
    }
    @PutMapping("/update-company")
    public ResponseEntity<Object> addCompany(@RequestBody Company company, @RequestHeader("Authorization") String authHeader, @RequestParam int companyId) throws SQLException {
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
        String query = "UPDATE company " +
                "SET name = ?, website = ?, champion = ? " +
                "WHERE company_id = ?";

        // Use try-with-resources for automatic resource management
        try (Connection userConnection = DriverManager.getConnection(dbUrl, env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement userStatement = userConnection.prepareStatement(query)) {

            // Safely set the parameters
            userStatement.setString(1, company.getName());
            userStatement.setString(2, company.getWebsite());
            userStatement.setString(3, company.getChampion());
            userStatement.setInt(4, companyId);

            userStatement.executeUpdate();

            // SUCCESS: Company was updated. Return 201 Created.
            return ResponseEntity.status(201).body(Map.of("message", "Company updated successfully"));

        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Object> logout(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(400).body(Map.of("error", "Malformed Authorization header."));
        }

        String token = authHeader.substring(7);

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

        String regexPattern = "^(?=.{1,64}@)[A-Za-z0-9_-]+(\\.[A-Za-z0-9_-]+)*@"
                + "[^-][A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)*(\\.[A-Za-z]{2,})$";

        if (!Pattern.compile(regexPattern).matcher(user.email).matches()) {
            return ResponseEntity.status(400).body(Map.of("error", "Invalid email."));
        }

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
        String sql = "SELECT u.user_id, u.first_name, u.last_name, u.email " +
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

    @GetMapping("/access")
    public ResponseEntity<Object> getAccessLevel(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Malformed Authorization header."));
        }

        String token = authHeader.substring(7);

        try {
            if (Authenticator.isTokenValid(token)) {
                String accessLevel = Authenticator.getAccessLevel(token);

                if (accessLevel.isEmpty()) {
                    return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
                } else {
                    return ResponseEntity.ok(Map.of("access_level", accessLevel));
                }
            } else {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized: Invalid or expired token"));
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
        }
    }

    /**
     *
     * @param authHeader
     * @return {@literal ResponseEntity<Object>}
     * <h3> jobs retriever</h3>
     * <p> userd for getting all jobs associated with a given access level</p>
     */
    @GetMapping("/job")
    public ResponseEntity<Object> getJobInfo(@RequestHeader("Authorization") String authHeader, @RequestParam("job_id") long id) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {//early return for incorrect auth token
            return ResponseEntity.status(401).body(Map.of("error", "Malformed Authorization header."));
        }
        //gets rid of the Bearer signiture
        String token = authHeader.substring(7);
        try {
            if (Authenticator.isTokenValid(token)) {
                //query to validate that the user has access to the job posting
                String sql = "WITH CurrentUser AS (" +
                        "  SELECT user_id " +
                        "  FROM login_sessions " +
                        "  WHERE token = ? AND expiry > NOW()" +
                        ") " +
                        "SELECT j.job_id " +
                        "FROM job j, CurrentUser cu " +
                        "WHERE j.job_id = ? " +
                        "AND (" +
                        "  EXISTS (" +
                        "    SELECT 1 " +
                        "    FROM admins a " +
                        "    WHERE a.user_id = cu.user_id" +
                        "  ) " +
                        "  OR " +
                        "  EXISTS (" +
                        "    SELECT 1 " +
                        "    FROM rep r " +
                        "    WHERE r.user_id = cu.user_id " +
                        "      AND r.company_id = j.company_id" +
                        "  ) " +
                        "  OR " +
                        "  EXISTS (" +
                        "    SELECT 1 " +
                        "    FROM student s " +
                        "    WHERE s.user_id = cu.user_id " +
                        "      AND (" +
                        "        (s.year = 1 AND j.residency IN ('r1', 'r2', 'r1+r2')) OR " +
                        "        (s.year = 2 AND j.residency = 'r3') OR " +
                        "        (s.year = 3 AND j.residency = 'r4') OR " +
                        "        (s.year = 4 AND j.residency = 'r5')" +
                        "      )" +
                        "  )" +
                        ");";
                try (Connection con = DriverManager.getConnection(dbUrl, env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
                     PreparedStatement statement = con.prepareStatement(sql)) {
                    statement.setString(1, token);
                    statement.setLong(2, id);

                    try (ResultSet rs = statement.executeQuery()) {
                        if (!rs.next()) {
                            return ResponseEntity.status(404).body(Map.of("error", "Unauthorized: you don't have access to this job"));
                        }
                    }
                }


                sql = "SELECT j.job_id, j.job_title, j.salary, " +
                        "j.description, j.position_count, c.name, c.company_id, " +
                        "j.residency, j.approval, j.residency_title, " +
                        "j.salary, c.website, j.small_description " +
                        "FROM job j " +
                        "INNER JOIN company c " +
                        "ON j.company_id = c.company_id " +
                        "WHERE j.job_id = ?";

                try (Connection con = DriverManager.getConnection(dbUrl, env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
                     PreparedStatement statement = con.prepareStatement(sql)) {

                    statement.setLong(1, id);

                    try (ResultSet rs = statement.executeQuery()) {
                        if (rs.next()) {
                            Map<String, Object> userData = new HashMap<>();

                            userData.put("job_title", rs.getString("job_title"));
                            userData.put("residency_title", rs.getString("residency_title"));
                            userData.put("description", rs.getString("description"));
                            userData.put("position_count", rs.getInt("position_count"));
                            userData.put("company_name", rs.getString("name"));
                            userData.put("company_id", rs.getString("company_id"));
                            userData.put("approval", rs.getString("approval"));
                            userData.put("salary", rs.getFloat("salary"));
                            userData.put("website", rs.getString("website"));
                            userData.put("residency", rs.getString("residency"));
                            userData.put("small_description", rs.getString("small_description"));

                            return ResponseEntity.ok(userData);
                        } else {
                            return ResponseEntity.status(404).body(Map.of("error", "job not found."));
                        }
                    }
                }
            } else {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized: Invalid or expired token."));
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
        }
    }


    @GetMapping("/jobs")
    public ResponseEntity<Object> getJobs(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {//early return for incorrect auth token
            return ResponseEntity.status(401).body(Map.of("error", "Malformed Authorization header."));
        }
        //gets rid of the Bearer signiture
        String token = authHeader.substring(7);

        try {
            if (Authenticator.isTokenValid(token)) {
                switch (Authenticator.getAccessLevel(token)) {//check access level
                    case "admin":
                        //query for getting all jobs
                        String sql = "SELECT j.job_id, j.job_title, j.approval, " +
                                "j.salary, j.small_description, j.residency, c.name, " +
                                "j.post_date, j.position_count " +
                                "FROM job j " +
                                "INNER JOIN company c " +
                                "ON j.company_id = c.company_id";

                        //stores all the job descriptions
                        List<SmallJob> userData = new ArrayList<>();

                        //tries to connect to db
                        try (Connection connection = DriverManager.getConnection(dbUrl,
                                env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
                             PreparedStatement statement = connection.prepareStatement(sql)) {
                            try (ResultSet rs = statement.executeQuery()) {
                                //get all jobs
                                while (rs.next()) {
                                    //add the job info
                                    SmallJob jobInfo = new SmallJob((long)
                                            rs.getInt("job_id"), rs.getString("job_title"),
                                            rs.getString("name"), rs.getString("small_description"),
                                            rs.getFloat("salary"), rs.getString("residency"),
                                            rs.getTimestamp("post_date"),
                                            rs.getInt("position_count"),
                                            rs.getString("approval")
                                    );
                                    userData.add(jobInfo);

                                }
                            }
                        }
                        //if connection not made
                        catch (SQLException e) {
                            e.printStackTrace();
                            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
                        }
                        return ResponseEntity.ok(userData);

                    //if access level is student
                    case "student":
                        //check yaar of student and only show associated residencies
                        //similar format to admin check comments for reference
                        switch (Student.getYear(token)) {
                            case "1":
                                sql = "SELECT j.job_title, j.job_id, " +
                                        "j.salary, j.small_description, j.residency, c.name, j.post_date, j.position_count " +
                                        "FROM job j " +
                                        "INNER JOIN company c " +
                                        "ON j.company_id = c.company_id " +
                                        "WHERE j.residency = 'r1' OR 'r2' OR 'r1+r2' " +
                                        "AND j.approval ='approved'";
                                userData = new ArrayList<>();
                                try (Connection connection = DriverManager.getConnection(dbUrl,
                                        env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
                                     PreparedStatement statement = connection.prepareStatement(sql)) {
                                    try (ResultSet rs = statement.executeQuery()) {
                                        while (rs.next()) {
                                            SmallJob jobInfo = new SmallJob((long) rs.getInt("job_id"), rs.getString("job_title"),
                                                    rs.getString("name"), rs.getString("small_description"),
                                                    rs.getFloat("salary"), rs.getString("residency"),
                                                    rs.getTimestamp("post_date"), rs.getInt("position_count"));
                                            userData.add(jobInfo);

                                        }

                                    }
                                } catch (SQLException e) {
                                    e.printStackTrace();
                                    return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
                                }
                                return ResponseEntity.ok(userData);


                            case "2":
                                sql = "SELECT j.job_title, j.job_id, " +
                                        "j.salary, j.small_description, j.residency, c.name, j.post_date, j.position_count " +
                                        "FROM job j " +
                                        "INNER JOIN company c " +
                                        "ON j.company_id = c.company_id " +
                                        "WHERE j.residency = 'r3' " +
                                        "AND j.approval ='approved'";
                                userData = new ArrayList<>();
                                try (Connection connection = DriverManager.getConnection(dbUrl,
                                        env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
                                     PreparedStatement statement = connection.prepareStatement(sql)) {
                                    System.out.println("connected!!");
                                    try (ResultSet rs = statement.executeQuery()) {
                                        while (rs.next()) {
                                            // Token is valid and we found the user
                                            SmallJob jobInfo = new SmallJob((long) rs.getInt("job_id"), rs.getString("job_title"),
                                                    rs.getString("name"), rs.getString("small_description"),
                                                    rs.getFloat("salary"), rs.getString("residency"),
                                                    rs.getTimestamp("post_date"), rs.getInt("position_count"));
                                            userData.add(jobInfo);

                                        }
                                    }
                                } catch (SQLException e) {
                                    e.printStackTrace();
                                    return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
                                }

                                return ResponseEntity.ok(userData);
                            case "3":
                                sql = "SELECT j.job_title, j.job_id, " +
                                        "j.salary, j.small_description, j.residency, c.name, j.post_date, j.position_count " +
                                        "FROM job j " +
                                        "INNER JOIN company c " +
                                        "ON j.company_id = c.company_id " +
                                        "WHERE j.residency = 'r4'" +
                                        "AND j.approval ='approved'";
                                userData = new ArrayList<>();
                                try (Connection connection = DriverManager.getConnection(dbUrl,
                                        env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
                                     PreparedStatement statement = connection.prepareStatement(sql)) {
                                    System.out.println("connected!!");
                                    try (ResultSet rs = statement.executeQuery()) {
                                        while (rs.next()) {
                                            // Token is valid and we found the user
                                            SmallJob jobInfo = new SmallJob((long) rs.getInt("job_id"), rs.getString("job_title"),
                                                    rs.getString("name"), rs.getString("small_description"),
                                                    rs.getFloat("salary"), rs.getString("residency"),
                                                    rs.getTimestamp("post_date"), rs.getInt("position_count"));
                                            userData.add(jobInfo);

                                        }
                                    }
                                } catch (SQLException e) {
                                    e.printStackTrace();
                                    return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
                                }

                                return ResponseEntity.ok(userData);
                            case "4":
                                sql = "SELECT j.job_title, j.job_id, " +
                                        "j.salary, j.small_description, j.residency, c.name, j.post_date, j.position_count " +
                                        "FROM job j " +
                                        "INNER JOIN company c " +
                                        "ON j.company_id = c.company_id " +
                                        "WHERE j.residency = 'r5'" +
                                        "AND j.approval ='approved'";
                                userData = new ArrayList<>();
                                try (Connection connection = DriverManager.getConnection(dbUrl,
                                        env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
                                     PreparedStatement statement = connection.prepareStatement(sql)) {
                                    System.out.println("connected!!");
                                    try (ResultSet rs = statement.executeQuery()) {
                                        while (rs.next()) {
                                            // Token is valid and we found the user
                                            SmallJob jobInfo = new SmallJob((long) rs.getInt("job_id"), rs.getString("job_title"),
                                                    rs.getString("name"), rs.getString("small_description"),
                                                    rs.getFloat("salary"), rs.getString("residency"),
                                                    rs.getTimestamp("post_date"), rs.getInt("position_count"));
                                            userData.add(jobInfo);

                                        }
                                    }
                                } catch (SQLException e) {
                                    e.printStackTrace();
                                    return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
                                }

                                return ResponseEntity.ok(userData);
                        }
                        break;
                    case "rep":
                        //prepared statement to prevent sql injections
                        sql = "SELECT j.job_title, j.job_id, j.approval," +
                                "j.salary, j.small_description, j.residency, c.name, j.post_date ,j.position_count " +
                                "FROM job j " +
                                "INNER JOIN company c " +
                                "ON j.company_id = c.company_id " +
                                "INNER JOIN rep rp " +
                                "ON rp.company_id = c.company_id " +
                                "INNER JOIN login_sessions ls " +
                                "ON rp.user_id = ls.user_id " +
                                "WHERE ls.token = ? " +
                                "AND ls.expiry > NOW()";

                        userData = new ArrayList<>();
                        try (Connection connection = DriverManager.getConnection(dbUrl,
                                env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
                             PreparedStatement statement = connection.prepareStatement(sql)) {
                            statement.setString(1, token);
                            try (ResultSet rs = statement.executeQuery()) {
                                //adds all the jobs associated with the reps company
                                while (rs.next()) {
                                    SmallJob jobInfo = new SmallJob((long) rs.getInt("job_id"), rs.getString("job_title"),
                                            rs.getString("name"), rs.getString("small_description"),
                                            rs.getFloat("salary"), rs.getString("residency"),
                                            rs.getString("approval"), rs.getTimestamp("post_date"), rs.getInt("position_count"));
                                    userData.add(jobInfo);

                                }
                            }

                        } catch (SQLException e) {
                            e.printStackTrace();
                            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
                        }
                        return ResponseEntity.ok(userData);
                }
            } else {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized: Invalid or expired token."));
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
        }
        return ResponseEntity.status(401).body(Map.of("testing", "not admin"));
    }

    @GetMapping("/student-info")
    public ResponseEntity<Object> getStudentInfo(@RequestHeader("Authorization") String authHeader, @RequestParam("user_id") int userId) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Malformed Authorization header."));
        }

        String token = authHeader.substring(7);

        try {
            if (Authenticator.isTokenValid(token)) {
                int callerId = Authenticator.getUserIdFromToken(token);
                String accessLevel = Authenticator.getAccessLevel(userId);

                if (!accessLevel.equals("admin") && callerId != userId) {
                    return ResponseEntity.status(403).body(Map.of("error", "Unauthorized: Invalid or expired token."));
                }

                String query =
                        "SELECT s.student_number, s.class_rank, s.user_id, s.year, " +
                                "EXISTS " +
                                "(SELECT 1 " +
                                "FROM student_preference sp " +
                                "WHERE sp.student_number = s.student_number) " +
                                "AS ranked " +
                                "FROM student s " +
                                "WHERE s.user_id = ?";


                try (Connection con = DriverManager.getConnection(dbUrl, env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
                     PreparedStatement statement = con.prepareStatement(query)) {

                    statement.setInt(1, userId);

                    try (ResultSet rs = statement.executeQuery()) {
                        if (rs.next()) {
                            Map<String, Object> userData = new HashMap<>();

                            userData.put("student_number", rs.getInt("student_number"));
                            userData.put("user_id", rs.getInt("user_id"));
                            userData.put("year", rs.getInt("year"));
                            userData.put("ranked", rs.getBoolean("ranked"));

                            return ResponseEntity.ok(userData);
                        } else {
                            return ResponseEntity.status(404).body(Map.of("error", "Student not found."));
                        }
                    }
                }
            } else {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized: Invalid or expired token."));
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
        }

    }

    @GetMapping("/rep-info")
    public ResponseEntity<Object> getRepInfo(@RequestHeader("Authorization") String authHeader, @RequestParam("user_id") int userId) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Malformed Authorization header."));
        }

        String token = authHeader.substring(7);

        try {
            if (Authenticator.isTokenValid(token)) {
                int callerId = Authenticator.getUserIdFromToken(token);
                String accessLevel = Authenticator.getAccessLevel(userId);

                if (!accessLevel.equals("admin") && callerId != userId) {
                    return ResponseEntity.status(403).body(Map.of("error", "Unauthorized: Invalid or expired token."));
                }

                String query = "SELECT * FROM rep WHERE user_id = ?";


                try (Connection con = DriverManager.getConnection(dbUrl, env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
                     PreparedStatement statement = con.prepareStatement(query)) {

                    statement.setInt(1, userId);

                    try (ResultSet rs = statement.executeQuery()) {
                        if (rs.next()) {
                            Map<String, Object> userData = new HashMap<>();

                            userData.put("rep_id", rs.getInt("rep_id"));
                            userData.put("user_id", rs.getInt("user_id"));
                            userData.put("company_id", rs.getInt("company_id"));

                            return ResponseEntity.ok(userData);
                        } else {
                            return ResponseEntity.status(404).body(Map.of("error", "Representative not found."));
                        }
                    }
                }
            } else {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized: Invalid or expired token."));
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
        }

    }

    @GetMapping("/company-info")
    public ResponseEntity<Object> getCompanyInfo(@RequestHeader("Authorization") String authHeader, @RequestParam("company_id") int companyId) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Malformed Authorization header."));
        }

        String token = authHeader.substring(7);

        try {
            if (Authenticator.isTokenValid(token)) {
                String query = "SELECT * FROM company WHERE company_id = ?";


                try (Connection con = DriverManager.getConnection(dbUrl, env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
                     PreparedStatement statement = con.prepareStatement(query)) {

                    statement.setInt(1, companyId);

                    try (ResultSet rs = statement.executeQuery()) {
                        if (rs.next()) {
                            Map<String, Object> userData = new HashMap<>();

                            userData.put("company_id", rs.getInt("company_id"));
                            userData.put("name", rs.getString("name"));
                            userData.put("champion", rs.getString("champion"));
                            userData.put("address_id", rs.getInt("address_id"));

                            return ResponseEntity.ok(userData);
                        } else {
                            return ResponseEntity.status(404).body(Map.of("error", "Company not found."));
                        }
                    }
                }
            } else {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized: Invalid or expired token."));
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
        }

    }
    @GetMapping("/companies")
    public ResponseEntity<Object> getCompanies(@RequestHeader("Authorization") String authHeader ) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Malformed Authorization header."));
        }

        String token = authHeader.substring(7);

        try {
            if (Authenticator.isTokenValid(token)) {
                String query = "SELECT * FROM company ";


                try (Connection con = DriverManager.getConnection(dbUrl, env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
                     PreparedStatement statement = con.prepareStatement(query)) {

                    List<Map> companies = new ArrayList<>();
                    try (ResultSet rs = statement.executeQuery()) {
                        while (rs.next()) {
                            Map<String, Object> userData = new HashMap<>();

                            userData.put("company_id", rs.getInt("company_id"));
                            userData.put("name", rs.getString("name"));
                            userData.put("champion", rs.getString("champion"));
                            userData.put("address_id", rs.getInt("address_id"));

                            companies.add(userData);
                        }
                        return ResponseEntity.ok(companies);
                    }
                }
            } else {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized: Invalid or expired token."));
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
        }

    }

    @PostMapping("/set-preferences")
    public ResponseEntity<Object> setPreferences(@RequestHeader("Authorization") String authHeader, @RequestBody ArrayList<StudentPreference> studentPreferences) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Malformed Authorization header."));
        }

        String token = authHeader.substring(7);

        try {
            if (Authenticator.isTokenValid(token)) {
                try {
                    StudentPreference.setStudentPreference(studentPreferences, token);
                    return ResponseEntity.status(201).body(Map.of("message", "job preferences sent successfully"));

                } catch (SQLException e) {
                    return ResponseEntity.status(404).body(Map.of("error", "job from other year detected or you are not a student "));
                }
            } else return ResponseEntity.status(401).body(Map.of("error", "Unauthorized: Invalid or expired token."));

        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
        }
    }

    @PostMapping("/create-job")
    public ResponseEntity<Object> createJob(@RequestHeader("Authorization") String authHeader, @RequestBody JobPost job) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Malformed Authorization header."));
        }

        String token = authHeader.substring(7);

        String query = "INSERT INTO job " +
                "(company_id, description, job_title, salary, small_description, " +
                "residency, residency_title, address_id, position_count)" +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try {
            var company = CompanyUtils.getCompanyInfoFromUserId(Authenticator.getUserIdFromToken(token));

            if (Authenticator.isTokenValid(token)) {
                try (Connection con = DriverManager.getConnection(dbUrl, env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
                     PreparedStatement statement = con.prepareStatement(query)) {
                    statement.setInt(1, company.id);
                    statement.setString(2, job.description);
                    statement.setString(3, job.title);
                    statement.setInt(4, job.salary);
                    statement.setString(5, job.small_description);
                    statement.setString(6, job.residency);
                    statement.setString(7, job.residency_title);
                    statement.setInt(8, company.addressId);
                    statement.setInt(9, job.position_count);

                    statement.executeUpdate();

                    return ResponseEntity.status(201).body(Map.of("message", "Job created successfully."));
                } catch (SQLException e) {
                    e.printStackTrace();
                    return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
                }
            } else {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized: Invalid or expired token."));
            }
        } catch (SQLException e) {
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
        }
    }

    @PostMapping("/update-job")
    public ResponseEntity<Object> updateJob(@RequestHeader("Authorization") String authHeader, @RequestBody JobPost job) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Malformed Authorization header."));
        }

        String token = authHeader.substring(7);

        String query = "UPDATE job " +
                "SET " +
                "position_count = COALESCE(?, position_count), " +
                "description = COALESCE(?, description), " +
                "job_title = COALESCE(?, job_title), " +
                "salary = COALESCE(?, salary), " +
                "small_description = COALESCE(?, small_description), " +
                "residency = COALESCE(?, residency), " +
                "residency_title = COALESCE(?, residency_title), " +
                "approval = COALESCE(?, approval) " +
                "WHERE job_id = ?";

        try {
            if (Authenticator.isTokenValid(token)) {
                int userId = Authenticator.getUserIdFromToken(token);
                String accessLevel = Authenticator.getAccessLevel(token);

                if (accessLevel.equals("student")) {
                    return ResponseEntity.status(401).body(Map.of("error", "Access denied."));
                } else if (accessLevel.equals("rep")) {
                    var company = CompanyUtils.getCompanyInfoFromUserId(userId);

                    if (!CompanyUtils.hasJob(company.id, job.job_id)) {
                        return ResponseEntity.status(401).body(Map.of("error", "Job not found."));
                    }
                }

                try (Connection con = DriverManager.getConnection(DatabaseUtils.url, env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
                     PreparedStatement statement = con.prepareStatement(query)) {

                    statement.setInt(1, job.position_count);
                    statement.setString(2, job.description);
                    statement.setString(3, job.title);
                    statement.setInt(4, job.salary);
                    statement.setString(5, job.small_description);
                    statement.setString(6, job.residency);
                    statement.setString(7, job.residency_title);
                    statement.setString(8, JobUtils.getJobStatus(job.approved));
                    statement.setInt(9, job.job_id);

                    statement.executeUpdate();

                    return ResponseEntity.status(200).body(Map.of("message", "Job updated successfully."));
                }
            } else {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired token."));
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
        }
    }

    @PostMapping("/remove-job")
    public ResponseEntity<Object> removeJob(@RequestHeader("Authorization") String authHeader, @RequestParam int job_id) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Malformed Authorization header."));
        }

        String token = authHeader.substring(7);

        String query = "DELETE FROM job WHERE job_id = ?";

        try {
            if (Authenticator.isTokenValid(token)) {
                int userId = Authenticator.getUserIdFromToken(token);
                String accessLevel = Authenticator.getAccessLevel(token);

                if (accessLevel.equals("student")) {
                    return ResponseEntity.status(401).body(Map.of("error", "Access denied."));
                } else if (accessLevel.equals("rep")) {
                    var company = CompanyUtils.getCompanyInfoFromUserId(userId);

                    if (!CompanyUtils.hasJob(company.id, job_id)) {
                        return ResponseEntity.status(401).body(Map.of("error", "Job not found."));
                    }
                }

                try (Connection con = DriverManager.getConnection(dbUrl, env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
                     PreparedStatement statement = con.prepareStatement(query)) {
                    statement.setInt(1, job_id);

                    statement.executeUpdate();

                    return ResponseEntity.status(200).body(Map.of("message", "Job deleted successfully."));
                }


            } else {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired token."));
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
        }
    }

    @GetMapping("jobs-to-rank")
    public ResponseEntity<Object> jobsToRank(@RequestHeader("Authorization") String authHeader, @RequestParam String residency) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Malformed Authorization header."));
        }
        String token = authHeader.substring(7);//get the token

        try {
            if (!Authenticator.getAccessLevel(token).equals("student")) {//make sure the user is a student
                return ResponseEntity.status(401).body(Map.of("error", "you are not a student"));
            }
            String year = Student.getYear(token);
            String sql;
            List<JobToRank> userData = new ArrayList<>();

            switch (residency) {
                case "r1":
                    if (!year.equals("1")) {
                        return ResponseEntity.status(401).body(Map.of("error", "you don't have access to these residencies"));
                    }
                    sql = "SELECT j.job_title, j.job_id, " +
                            " c.name " +
                            "FROM job j " +
                            "INNER JOIN company c " +
                            "ON j.company_id = c.company_id " +
                            "WHERE j.residency = 'r1' OR 'r1+r2' " +
                            "AND j.approval ='approved'";

                    try (Connection connection = DriverManager.getConnection(dbUrl,
                            env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
                         PreparedStatement statement = connection.prepareStatement(sql)) {
                        try (ResultSet rs = statement.executeQuery()) {
                            //adds all the jobs associated with the residency
                            while (rs.next()) {
                                JobToRank jobToRank = new JobToRank(rs.getString("job_title"), (long) rs.getInt("job_id"),
                                        rs.getString("name"));
                                userData.add(jobToRank);
                            }
                        }

                    } catch (SQLException e) {
                        e.printStackTrace();
                        return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
                    }
                    return ResponseEntity.ok(userData);
                case "r2":
                    if (!year.equals("1")) {
                        return ResponseEntity.status(401).body(Map.of("error", "you don't have access to these residencies"));
                    }
                    sql = "SELECT j.job_title, j.job_id, " +
                            " c.name " +
                            "FROM job j " +
                            "INNER JOIN company c " +
                            "ON j.company_id = c.company_id " +
                            "WHERE j.residency = 'r2' " +
                            "AND j.approval ='approved'";

                    try (Connection connection = DriverManager.getConnection(dbUrl,
                            env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
                         PreparedStatement statement = connection.prepareStatement(sql)) {
                        try (ResultSet rs = statement.executeQuery()) {
                            //adds all the jobs associated with the residency
                            while (rs.next()) {
                                JobToRank jobToRank = new JobToRank(rs.getString("job_title"), (long) rs.getInt("job_id"),
                                        rs.getString("name"));
                                userData.add(jobToRank);
                            }
                        }

                    } catch (SQLException e) {
                        e.printStackTrace();
                        return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
                    }
                    return ResponseEntity.ok(userData);
                case "r3":
                    if (!year.equals("2")) {
                        return ResponseEntity.status(401).body(Map.of("error", "you don't have access to these residencies"));
                    }
                    sql = "SELECT j.job_title, j.job_id, " +
                            " c.name " +
                            "FROM job j " +
                            "INNER JOIN company c " +
                            "ON j.company_id = c.company_id " +
                            "WHERE j.residency = 'r3' " +
                            "AND j.approval ='approved'";

                    try (Connection connection = DriverManager.getConnection(dbUrl,
                            env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
                         PreparedStatement statement = connection.prepareStatement(sql)) {
                        try (ResultSet rs = statement.executeQuery()) {
                            //adds all the jobs associated with the residency
                            while (rs.next()) {
                                JobToRank jobToRank = new JobToRank(rs.getString("job_title"), (long) rs.getInt("job_id"),
                                        rs.getString("name"));
                                userData.add(jobToRank);
                            }
                        }

                    } catch (SQLException e) {
                        e.printStackTrace();
                        return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
                    }
                    return ResponseEntity.ok(userData);
                case "r4":
                    if (!year.equals("3")) {
                        return ResponseEntity.status(401).body(Map.of("error", "you don't have access to these residencies"));
                    }
                    sql = "SELECT j.job_title, j.job_id, " +
                            " c.name " +
                            "FROM job j " +
                            "INNER JOIN company c " +
                            "ON j.company_id = c.company_id " +
                            "WHERE j.residency = 'r4' " +
                            "AND j.approval ='approved'";

                    try (Connection connection = DriverManager.getConnection(dbUrl,
                            env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
                         PreparedStatement statement = connection.prepareStatement(sql)) {
                        try (ResultSet rs = statement.executeQuery()) {
                            //adds all the jobs associated with the residency
                            while (rs.next()) {
                                JobToRank jobToRank = new JobToRank(rs.getString("job_title"), (long) rs.getInt("job_id"),
                                        rs.getString("name"));
                                userData.add(jobToRank);
                            }
                        }

                    } catch (SQLException e) {
                        e.printStackTrace();
                        return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
                    }
                    return ResponseEntity.ok(userData);
                case "r5":
                    if (!year.equals("4")) {
                        return ResponseEntity.status(401).body(Map.of("error", "you don't have access to these residencies"));
                    }
                    sql = "SELECT j.job_title, j.job_id, " +
                            " c.name " +
                            "FROM job j " +
                            "INNER JOIN company c " +
                            "ON j.company_id = c.company_id " +
                            "WHERE j.residency = 'r5' " +
                            "AND j.approval ='approved'";

                    try (Connection connection = DriverManager.getConnection(dbUrl,
                            env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
                         PreparedStatement statement = connection.prepareStatement(sql)) {
                        try (ResultSet rs = statement.executeQuery()) {
                            //adds all the jobs associated with the residency
                            while (rs.next()) {
                                JobToRank jobToRank = new JobToRank(rs.getString("job_title"), (long) rs.getInt("job_id"),
                                        rs.getString("name"));
                                userData.add(jobToRank);
                            }
                        }

                    } catch (SQLException e) {
                        e.printStackTrace();
                        return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
                    }
                    return ResponseEntity.ok(userData);
                default:
                    return ResponseEntity.status(401).body(Map.of("error", "residency must be enter in e.g r1"));
            }


        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
        }

    }

    @PostMapping("/allocate")
    public ResponseEntity<Object> allocate (@RequestHeader("Authorization") String authHeader, @RequestParam String residency){
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Malformed Authorization header."));
        }

        String token = authHeader.substring(7);

        try {
            if (!Authenticator.getAccessLevel(token).equals("admin")) {
                throw new SQLException("not an admin");
            }
        } catch (SQLException e) {
            return ResponseEntity.status(401).body(Map.of("error", "only admins can allocate"));
        }
        try {
            InterviewAllocation interviewsAllocations ;
            switch(residency){
                case "r1":
                    interviewsAllocations = new InterviewAllocation("1", "r1");
                    if(!interviewsAllocations.allPrefSet()){
                        return ResponseEntity.status(401).body(Map.of("error", "all students haven't ranked there preferences"));
                    }
                    interviewsAllocations.allocate();
                    break;
                case "r2":
                    interviewsAllocations = new InterviewAllocation("1", "r2");
                    if(!interviewsAllocations.allPrefSet()){
                    return ResponseEntity.status(401).body(Map.of("error", "all students haven't ranked there preferences"));
                }
                    interviewsAllocations.allocate();
                    break;
                case "r3":
                    interviewsAllocations = new InterviewAllocation("2", "r3");
                    if(!interviewsAllocations.allPrefSet()){
                        return ResponseEntity.status(401).body(Map.of("error", "all students haven't ranked there preferences"));
                    }
                    interviewsAllocations.allocate();
                    break;
                case "r4":
                    interviewsAllocations = new InterviewAllocation("3", "r4");
                    if(!interviewsAllocations.allPrefSet()){
                        return ResponseEntity.status(401).body(Map.of("error", "all students haven't ranked there preferences"));
                    }
                    interviewsAllocations.allocate();
                    break;
                case "r5":
                    interviewsAllocations = new InterviewAllocation("4", "r5");
                    if(!interviewsAllocations.allPrefSet()){
                        return ResponseEntity.status(401).body(Map.of("error", "all students haven't ranked there preferences"));
                    }
                    interviewsAllocations.allocate();
                default:
                    return ResponseEntity.status(401).body(Map.of("error", "please enter the residency correctly"));

            }
            return ResponseEntity.status(200).body(Map.of("success", "Interviews Allocated successfully"));

        }catch (SQLException e){
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
        }
    }
    @GetMapping("/get-allocations")
    public ResponseEntity<Object> getAllocations(@RequestHeader("Authorization") String authHeader, @RequestParam String residency){
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Malformed Authorization header."));
        }

        String token = authHeader.substring(7);

        try {
            if (!Authenticator.getAccessLevel(token).equals("admin")) {
                throw new SQLException("not an admin");
            }
        } catch (SQLException e) {
            return ResponseEntity.status(401).body(Map.of("error", "only admins can allocate"));
        }
        try{
          return ResponseEntity.ok(Interview.getInterviews(residency));
        }catch (SQLException e){
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
        }




    }


    @GetMapping("/get-users")
    public  ResponseEntity<Object> getUsers(@RequestHeader("Authorization") String authHeader,@RequestParam String userType){
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Malformed Authorization header."));
        }

        String token = authHeader.substring(7);
        String sql;
        List<Object> usersDataList = new ArrayList<>();

        try {
            if (Authenticator.getAccessLevel(token).equals("admin")) {
                //get info associated with rep users
                switch (userType) {
                    case "admins":
                        sql = "SELECT u.user_id, u.email, u.first_name, " +
                                "u.last_name " +
                                "FROM users u " +
                                "JOIN admins a ON u.user_id = a.user_id ";
                        try (Connection connection = DriverManager.getConnection(dbUrl,
                                env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
                             PreparedStatement statement = connection.prepareStatement(sql)) {
                            try (ResultSet rs = statement.executeQuery()) {
                                while (rs.next()) {
                                    Map<String, Object> userData = new HashMap<>();
                                    userData.put("userId", rs.getInt("user_id"));
                                    userData.put("firstName", rs.getString("first_name"));
                                    userData.put("lastName", rs.getString("last_name"));
                                    userData.put("email", rs.getString("email"));
                                    usersDataList.add(userData);

                                }
                                return ResponseEntity.ok(usersDataList);
                            }
                        } catch (SQLException e) {
                            e.printStackTrace();
                            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
                        }
                    case "reps":
                        sql = "SELECT u.user_id, u.email, u.first_name, " +
                                "u.last_name, r.rep_id, r.company_id, " +
                                "c.name AS company_name " +
                                "FROM users u " +
                                "JOIN rep r ON u.user_id = r.user_id " +
                                "JOIN company c ON r.company_id = c.company_id;";
                        try (Connection connection = DriverManager.getConnection(dbUrl,
                                env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
                             PreparedStatement statement = connection.prepareStatement(sql)) {
                            try (ResultSet rs = statement.executeQuery()) {
                                while (rs.next()) {
                                    usersDataList.add(new RepUser(rs.getLong("user_id"), rs.getString("first_name"), rs.getString("last_name"),
                                            rs.getString("email"), rs.getLong("rep_id"), rs.getLong("company_id"), rs.getString("company_name")));
                                }
                                return ResponseEntity.ok(usersDataList);
                            }
                        } catch (SQLException e) {
                            e.printStackTrace();
                            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
                        }
                    case "students":
                        sql = "SELECT u.user_id, u.email, u.first_name, u.last_name, " +
                                "s.student_number, s.year, s.class_rank, " +
                                "EXISTS (SELECT 1 FROM student_preference sp WHERE sp.student_number = s.student_number) AS is_ranked " +
                                "FROM users u " +
                                "JOIN student s ON u.user_id = s.user_id";
                        try (Connection connection = DriverManager.getConnection(dbUrl,
                                env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
                             PreparedStatement statement = connection.prepareStatement(sql)) {
                            try (ResultSet rs = statement.executeQuery()) {
                                while (rs.next()) {
                                    Map<String, Object> userData = new HashMap<>();
                                    userData.put("userId", rs.getInt("user_id"));
                                    userData.put("firstName", rs.getString("first_name"));
                                    userData.put("lastName", rs.getString("last_name"));
                                    userData.put("email", rs.getString("email"));
                                    userData.put("studentNumber", rs.getInt("student_number"));
                                    userData.put("year", rs.getString("year"));
                                    userData.put("classRank",rs.getInt("class_rank"));
                                    userData.put("isRanked", rs.getBoolean("is_ranked"));
                                    usersDataList.add(userData);
                                }
                                return ResponseEntity.ok(usersDataList);
                            }

                        } catch (SQLException e) {
                            e.printStackTrace();
                            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
                        }
                    default:
                        return ResponseEntity.status(401).body(Map.of("error", "Please enter a userType"));
                }
            } else return ResponseEntity.status(401).body(Map.of("error", "Unauthorized: Invalid or expired token."));

        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
        }
    }
    @DeleteMapping("/delete-user")
    public ResponseEntity<Object> deleteUser(@RequestHeader("Authorization") String authHeader, @RequestParam int userId){
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(400).body(Map.of("error", "Malformed Authorization header."));
        }
        String token = authHeader.substring(7);

        try {
            if (Authenticator.getAccessLevel(token).equals("admin")) {
                String sql = "DELETE FROM users WHERE user_id = ?";
                try (Connection connection = DriverManager.getConnection(dbUrl,
                        env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
                     PreparedStatement statement = connection.prepareStatement(sql)) {
                    statement.setInt(1, userId);
                    statement.executeUpdate();
                    return ResponseEntity.ok(Map.of("message", "User deleted"));
                }
            } else {
                return ResponseEntity.status(401).body(Map.of("error", "You are not an admin."));
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred during logout."));
        }
    }

    @PostMapping("/create-user")
    public ResponseEntity<Object> createUser(@RequestHeader("Authorization") String authHeader, @RequestBody CreateUser user) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(400).body(Map.of("error", "Malformed Authorization header."));
        }

        String token = authHeader.substring(7);

        String dynamic_salt = user.email;
        String static_salt = "892225800";
        user.password = SHA256.hash(dynamic_salt + user.password + static_salt);

        try {
            if (Authenticator.isTokenValid(token)) {
                if (Authenticator.getAccessLevel(token).equals("admin")) {
                    switch (user.userType) {
                        case "student":
                            return UserUtils.addStudent(user);
                        case "rep":
                            return UserUtils.addRep(user);
                        case "admin":
                            return UserUtils.addAdmin(user);
                        default:
                            return ResponseEntity.status(400).body(Map.of("error", "Invalid user type."));
                    }
                } else {
                    return ResponseEntity.status(401).body(Map.of("error", "You are not an admin."));
                }
            } else {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid token."));
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
        }
    }
}
