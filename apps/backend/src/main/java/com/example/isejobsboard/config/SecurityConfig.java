package com.example.isejobsboard.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Disable CSRF, common for stateless APIs
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/api/v1/**", "/actuator/**").permitAll() // Permit your API and actuator
                .anyRequest().permitAll() // TEMPORARILY PERMIT EVERYTHING ELSE FOR TESTING
                                           // We will tighten this later if needed.
            )
            // Ensure stateless session management, as we're not using traditional logins
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Disable HTTP Basic authentication
            .httpBasic(basic -> basic.disable())
            // Disable Form-based login
            .formLogin(form -> form.disable());

        return http.build();
    }
}
