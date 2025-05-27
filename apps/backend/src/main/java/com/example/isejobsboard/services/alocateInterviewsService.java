package com.example.isejobsboard.services;
import com.example.isejobsboard.model.Student;
import org.springframework.boot.autoconfigure.batch.BatchProperties;

import java.util.ArrayList;

//public class alocateInterviewsService {
//    public static void allocate(ArrayList<Student> StudentRanking){
//        for(Student student:StudentRanking){
//            for(BatchProperties.Job preferedJob : student.preferences){
//                if (student.interviewAllocation.size() == 3){
//                    break;
//                }
//                if(preferedJob.inteviewsAlocations.size() < preferedJob.max &! student.hasCompany(preferedJob)){
//                    preferedJob.inteviewsAlocations.add(student);
//                    student.interviewAllocation.add(preferedJob);
//                }
//            }
//        }
//    }
//
//
//}
