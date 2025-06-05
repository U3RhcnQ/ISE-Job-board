package com.example.isejobsboard.Utils;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JobUtilsTest {
    @Test
    void testGetJobStatusRejected() {
        assertEquals("rejected", JobUtils.getJobStatus(0));
    }

    @Test
    void testGetJobStatusApproved() {
        assertEquals("approved", JobUtils.getJobStatus(1));
    }

    @Test
    void testGetJobStatusPending() {
        assertEquals("pending", JobUtils.getJobStatus(2));
        assertEquals("pending", JobUtils.getJobStatus(-1));
        assertEquals("pending", JobUtils.getJobStatus(999));
    }
}