package com.example.isejobsboard.repository;

import com.example.isejobsboard.model.GreetingMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GreetingMessageRepository extends JpaRepository<GreetingMessage, Long> {
    // You can add custom query methods here if needed later
}