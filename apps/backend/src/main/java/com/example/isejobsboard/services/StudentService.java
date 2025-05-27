package com.example.isejobsboard.services;
//https://www.geeksforgeeks.org/how-to-work-with-databases-using-spring-boot/
import com.example.isejobsboard.model.Student;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.isejobsboard.repository.StudentRepository;

import java.util.ArrayList;
import java.util.List;

@Service
public class StudentService {
    @Autowired
    private StudentRepository studentRepository;

    private static final List<Student> dummyStudents = new ArrayList<>();

    // Static initializer block to populate the dummy list once
    static {
        dummyStudents.add(new Student("1111","Alice", "Smith", "alice.smith@example.com"));
        dummyStudents.add(new Student("1111111", "Bob", "Johnson", "bob.johnson@example.com"));
         }

    public List<Student> getAllStudents(){
        return dummyStudents;
        //return studentRepository.findAll();
    }
    public Student getStudentById(Long id){
        return studentRepository.findById(id).orElse(null);

    }
//    public Student updateStudent(Long id, Student student){
//        Student existingStudent = studentRepository.findById(id).orElse(null);
//    }
}
