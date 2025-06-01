package com.example.isejobsboard.controller;

import com.example.isejobsboard.Utils.CompanyUtils;
import com.example.isejobsboard.Utils.DatabaseUtils;
import com.example.isejobsboard.Utils.JobUtils;
import com.example.isejobsboard.model.GreetingMessage;
import com.example.isejobsboard.model.SmallJob;
import com.example.isejobsboard.controller.schemas.Student;
import com.example.isejobsboard.repository.GreetingMessageRepository;
import com.example.isejobsboard.security.SHA256;
import com.example.isejobsboard.Utils.CompanyUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

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
        public ResponseEntity<Object> getJobInfo(@RequestHeader("Authorization") String authHeader, @RequestParam("job_id") long id){
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {//early return for incorrect auth token
            return ResponseEntity.status(401).body(Map.of("error", "Malformed Authorization header."));
        }
        //gets rid of the Bearer signiture
        String token = authHeader.substring(7);
        try{
            if(Authenticator.isTokenValid(token)){
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
                    statement.setString(1,token);
                    statement.setLong(2, id);

                    try (ResultSet rs = statement.executeQuery()) {
                         if(!rs.next()) {
                            return ResponseEntity.status(404).body(Map.of("error", "Unauthorized: you don't have access to this job"));
                        }
                    }
                }


                sql = "SELECT j.job_id, j.job_title, j.salary, " +
                        "j.description, j.position_count, c.name, " +
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
                            userData.put("approval", rs.getString("approval"));
                            userData.put("salary", rs.getFloat("salary"));
                            userData.put("website", rs.getString("website"));
                            userData.put("residency", rs.getString("residency"));
                            userData.put("small_description",rs.getString("small_description"));

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
    public ResponseEntity<Object> getJobs(@RequestHeader("Authorization") String authHeader){
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {//early return for incorrect auth token
            return ResponseEntity.status(401).body(Map.of("error", "Malformed Authorization header."));
        }
        //gets rid of the Bearer signiture
        String token = authHeader.substring(7);

        try {
            if (Authenticator.isTokenValid(token)) {
                switch (Authenticator.getAccessLevel(token)){//check access level
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
                                    SmallJob jobInfo = new SmallJob((long) rs.getInt("job_id"),rs.getString("job_title"),
                                            rs.getString("name"),rs.getString("small_description"),
                                            rs.getFloat("salary"),rs.getString("residency"),rs.getTimestamp("post_date"),
                                            rs.getInt("position_count"));
                                    userData.add( jobInfo);

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
                        switch (Student.getYear(token)){
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
                                            SmallJob jobInfo = new SmallJob((long) rs.getInt("job_id"),rs.getString("job_title"),
                                                    rs.getString("name"),rs.getString("small_description"),
                                                    rs.getFloat("salary"),rs.getString("residency"),
                                                    rs.getTimestamp("post_date"),rs.getInt("position_count"));
                                            userData.add( jobInfo);

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
                                            SmallJob jobInfo = new SmallJob((long) rs.getInt("job_id"),rs.getString("job_title"),
                                                    rs.getString("name"),rs.getString("small_description"),
                                                    rs.getFloat("salary"),rs.getString("residency"),
                                                    rs.getTimestamp("post_date"), rs.getInt("position_count"));
                                            userData.add( jobInfo);

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
                                            SmallJob jobInfo = new SmallJob((long) rs.getInt("job_id"),rs.getString("job_title"),
                                                    rs.getString("name"),rs.getString("small_description"),
                                                    rs.getFloat("salary"),rs.getString("residency"),
                                                    rs.getTimestamp("post_date"), rs.getInt("position_count"));
                                            userData.add( jobInfo);

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
                                            SmallJob jobInfo = new SmallJob((long) rs.getInt("job_id"),rs.getString("job_title"),
                                                    rs.getString("name"),rs.getString("small_description"),
                                                    rs.getFloat("salary"),rs.getString("residency"),
                                                    rs.getTimestamp("post_date"), rs.getInt("position_count"));
                                            userData.add( jobInfo);

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
                                    SmallJob jobInfo = new SmallJob((long) rs.getInt("job_id"),rs.getString("job_title"),
                                            rs.getString("name"),rs.getString("small_description"),
                                            rs.getFloat("salary"),rs.getString("residency"),
                                            rs.getString("approval"),rs.getTimestamp("post_date"),rs.getInt("position_count"));
                                    userData.add(jobInfo);

                                }
                            }

                        } catch (SQLException e) {
                            e.printStackTrace();
                            return ResponseEntity.status(500).body(Map.of("error", "An internal server error occurred."));
                        }
                        return ResponseEntity.ok(userData);
                }
            }
            else {
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

    @PostMapping("/set-preferences")
    public ResponseEntity<Object> setPreferences(@RequestHeader("Authorization") String authHeader, @RequestBody ArrayList<StudentPreference> studentPreferences){

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Malformed Authorization header."));
        }

        String token = authHeader.substring(7);

        try {
            if (Authenticator.isTokenValid(token)) {
                try{
                StudentPreference.setStudentPreference(studentPreferences, token);
                return ResponseEntity.status(201).body(Map.of("message", "job preferences sent successfully"));

                } catch (SQLException e) {
                    return ResponseEntity.status(404).body(Map.of("error", "job from other year detected or you are not a student "));
                }
            }
            else return ResponseEntity.status(401).body(Map.of("error" ,"Unauthorized: Invalid or expired token."));

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

        String query = "UPDATE jobs_board.job " +
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

        String query = "DELETE FROM jobs_board.job WHERE job_id = ?";

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

//    @GetMapping("/test")
//    public ResponseEntity<Object>test(){
//        try{
//
//            return ResponseEntity.ok(Job.getJobs("r3"));
//        }catch (SQLException e){
//            e.printStackTrace();
//            return ResponseEntity.status(500).body(Map.of("error", "it didnt pass the test"));
//        }
//    }

}
