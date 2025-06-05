package com.example.isejobsboard.Utils;

import java.util.Map;
import java.util.Optional;

public class DatabaseUtils {

    public static String url;
    public static final Map<String, String> env = System.getenv();

    // Static initializer block: This code runs once when the class is loaded
    static {
        // Attempt to get the database URL from the "DATABASE_URL" environment variable.
        url = Optional.ofNullable(System.getenv("DATABASE_URL"))
                .orElse("jdbc:mysql://localhost:3306/jobs_board?allowMultiQueries=true");

    }

}
