package com.example.isejobsboard.controller;

import com.example.isejobsboard.model.Student;
import com.example.isejobsboard.services.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("Students")
public class StudentController {
    @Autowired
    private StudentService studentService;

    @GetMapping("/students")
    public List<Student> getAllStudent(){
        return studentService.getAllStudents();
    }
}
