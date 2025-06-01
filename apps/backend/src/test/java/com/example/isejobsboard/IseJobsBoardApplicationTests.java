package com.example.isejobsboard;

import com.example.isejobsboard.controller.schemas.Job;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.sql.SQLException;

@SpringBootTest
class IseJobsBoardApplicationTests {

	@Test
	void contextLoads() {
	}
	@Test
	void getJobsTest(){
        try {
            Job.getJobs("r3");
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }
}
