package com.example.isejobsboard.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService; // <-- Add this import
import org.springframework.security.provisioning.InMemoryUserDetailsManager; // <-- Add this import
import org.springframework.security.web.SecurityFilterChain;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;
import java.util.List;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(withDefaults())
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

    // --- BEAN DEFINITION FOR CORS CONFIGURATION ---
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // This is your React frontend's origin (adjust if your dev port is different)
        configuration.addAllowedOriginPattern("http://localhost:*");
        configuration.addAllowedOriginPattern("http://127.0.0.1:*");
        configuration.addAllowedOriginPattern("https://isejobsboard.petr.ie");
        configuration.addAllowedOriginPattern("http://isejobsboard.petr.ie");
        // Allow common HTTP methods. OPTIONS is crucial for preflight requests.
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        // Allow all headers requested by the client. For production, you might want to be more specific.
        configuration.setAllowedHeaders(List.of("*"));
        // If your frontend needs to read custom headers from the response (e.g., a custom auth header),
        // you might need to expose them:
        // configuration.setExposedHeaders(Arrays.asList("Authorization", "X-Custom-Header"));
        // Allow credentials (cookies, authorization headers). Important for many auth scenarios.
        configuration.setAllowCredentials(true);
        // How long the results of a preflight request can be cached by the browser (in seconds).
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Apply this CORS configuration to all paths under "/api/v1/"
        source.registerCorsConfiguration("/api/v1/**", configuration);
        // If you have other API base paths that need CORS, register them too:
        // source.registerCorsConfiguration("/another-api-path/**", configuration);
        return source;
    }
    // --- END OF CORS CONFIGURATION BEAN ---

    @Bean
    public UserDetailsService userDetailsService() {
        // Provides an empty user manager. No users are defined.
        // This is sufficient to prevent UserDetailsServiceAutoConfiguration from kicking in. [cite: 61, 62]
        return new InMemoryUserDetailsManager();
    }
}
