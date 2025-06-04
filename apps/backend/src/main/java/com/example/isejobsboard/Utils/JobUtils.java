package com.example.isejobsboard.Utils;

public class JobUtils {
    public static String getJobStatus(int status) {
        switch (status) {
            case 0:
                return "rejected";
            case 1:
                return "approved";
            default:
                return "pending";
        }
    }
}
