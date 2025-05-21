package com.example.isejobsboard.controller; // Adjusted package name

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1") // This is the base path for all endpoints in this controller
public class ApiController {

    @GetMapping("/greeting")
    public Map<String, String> getGreeting() {
        return Map.of("message", "Hello from Spring Boot Backend!");
    }
}

//test
