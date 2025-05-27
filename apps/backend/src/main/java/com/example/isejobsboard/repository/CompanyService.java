package com.example.isejobsboard.repository;

import com.example.isejobsboard.model.Company;
import com.example.isejobsboard.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyService extends JpaRepository<Company,Long> {
}
