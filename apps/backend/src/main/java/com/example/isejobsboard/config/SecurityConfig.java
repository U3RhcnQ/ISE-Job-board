package com.example.isejobsboard.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService; // <-- Add this import
import org.springframework.security.provisioning.InMemoryUserDetailsManager; // <-- Add this import
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/api/v1/**", "/actuator/**").permitAll() // Permit your API and actuator
                .anyRequest().permitAll() // TEMPORARILY PERMIT EVERYTHING ELSE FOR TESTING
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .httpBasic(basic -> basic.disable())
            .formLogin(form -> form.disable());
        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        // Provides an empty user manager. No users are defined.
        // This is sufficient to prevent UserDetailsServiceAutoConfiguration from kicking in. [cite: 61, 62]
        return new InMemoryUserDetailsManager();
    }
}
