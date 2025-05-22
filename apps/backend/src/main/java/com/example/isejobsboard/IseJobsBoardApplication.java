package com.example.isejobsboard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import; 
import com.example.isejobsboard.config.SecurityConfig; 

@SpringBootApplication
@Import(SecurityConfig.class)
public class IseJobsBoardApplication {

    public static void main(String[] args) {
        SpringApplication.run(IseJobsBoardApplication.class, args);
    }
}
