package com.example.isejobsboard.config; // Adjust package if needed

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorizeRequests ->
                authorizeRequests
                    .requestMatchers("/api/v1/**", "/actuator/health").permitAll() // Allow all requests to /api/v1/**
                    .anyRequest().authenticated() // All other requests require authentication (if any)
            )
            .httpBasic(withDefaults()); // Keep basic auth for other potential endpoints, or remove if not needed
            // If you want to completely disable security for now (NOT recommended for production):
            // .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            // .csrf(csrf -> csrf.disable()); // Also disable CSRF if completely open
        return http.build();
    }
}
