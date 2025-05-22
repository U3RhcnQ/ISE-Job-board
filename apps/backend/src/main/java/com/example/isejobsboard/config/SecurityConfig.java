package com.example.isejobsboard.config; // Ensure this matches your directory structure

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@Order(1) // Try adding a specific order to ensure it's considered
public class SecurityConfig {

    @Bean
    public SecurityFilterChain apiFilterChain(HttpSecurity http) throws Exception {
        http
            // Apply this filter chain only to /api/** and /actuator/** paths
            .securityMatcher("/api/v1/**", "/actuator/**")
            .authorizeHttpRequests(authorize -> authorize
                .anyRequest().permitAll() // Permit all requests matching the securityMatcher
            )
            .csrf(csrf -> csrf.disable()) // Disable CSRF for these paths
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // Stateless
            .httpBasic(basic -> basic.disable()) // Disable HTTP Basic for these paths
            .formLogin(form -> form.disable()); // Disable Form Login for these paths
        return http.build();
    }

    // You might need a default security filter chain if you have other endpoints,
    // or if the one above doesn't get picked up as the primary.
    // For now, let's see if the one above works and removes the default password.
    // If you still get the default password, Spring might require a default chain.
    // @Bean
    // @Order(2) // Lower precedence
    // public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
    //     http
    //         .authorizeHttpRequests(authorize -> authorize
    //             .anyRequest().authenticated() // Secure everything else by default
    //         )
    //         .httpBasic(withDefaults())
    //         .formLogin(withDefaults());
    //     return http.build();
    // }
}
