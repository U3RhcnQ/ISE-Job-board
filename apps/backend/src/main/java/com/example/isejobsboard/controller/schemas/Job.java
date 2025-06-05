package com.example.isejobsboard.controller.schemas;

import com.example.isejobsboard.Utils.DatabaseUtils;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;



enum Approval{
    APPROVED,
    PENDING,
    REJECTED
}
public class Job {
    private final Long jobId;
    private  final Long companyId;
    private final int positionCount;
    private String description;
    private String smallDes;
    private String residency;
    private String jobTitle;
    private Long addressId;
    private String residencyTitle;
    private Approval approval;
    private String salary;
    public ArrayList<Student> interviews;
    private static final Map<String, String> env = System.getenv();
    private static final String dbUrl = DatabaseUtils.url;

    public Job(Long jobId, Long companyId,
               int positionCount, String description,
               String smallDes, String residency,
               String jobTitle, Long addressId,
               String residencyTitle, Approval approval,
               String salary) {
        this.jobId = jobId;
        this.companyId = companyId;
        this.positionCount = positionCount;
        this.description = description;
        this.smallDes = smallDes;
        this.residency = residency;
        this.jobTitle = jobTitle;
        this.addressId = addressId;
        this.residencyTitle = residencyTitle;
        this.approval = approval;
        this.salary = salary;
    }

    public Job(Long jobId,Long companyId,int positionCount ){
        this.jobId = jobId;
        this.companyId = companyId;
        this.positionCount = positionCount;
        this.interviews = new ArrayList<>();
    }
    public Long getJobId() {
        return jobId;
    }

    public Long getCompanyId() {
        return companyId;
    }

    public int getPositionCount() {
        return positionCount;
    }

    public String getDescription() {
        return description;
    }

    public String getSmallDes() {
        return smallDes;
    }

    public String getResidency() {
        return residency;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public Long getAddressId() {
        return addressId;
    }

    public String getResidencyTitle() {
        return residencyTitle;
    }

    public Approval getApproval() {
        return approval;
    }
    public String getSalary(){
        return this.salary;
    }

    public static void insertNewJob(Job job){
        String sql = "INSERT INTO job ("+
                "company_id, position_count"+
                "description, job_title, salary,"+
                "small_description, residency, "+
                "residency_title, address_id)"+
                "VALUES (?,?,?,?,?,?,?,?,?)";
        try (Connection connection = DriverManager.getConnection(dbUrl,
                env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setLong(1,job.getCompanyId());
            statement.setInt(2,job.getPositionCount());
            statement.setString(3,job.getDescription());
            statement.setString(4,job.getJobTitle());
            statement.setString(5,job.getSalary());
            statement.setString(6,job.getSmallDes());
            statement.setString(7,job.getResidency());
            statement.setString(8,job.getResidencyTitle());
            statement.setLong(9,job.getAddressId());

            statement.executeUpdate();

        }catch (SQLException e) {
            throw new RuntimeException(e);
        }

    }
    public static void updateJob(Job job){
        String sql = "UPDATE job SET position_count = ?," +
                "description = ?, job_title = ?," +
                "salary = ?, small_description, " +
                "residency = ?, residency_title = ?" +
                "WHERE job_id = ?;";
        try (Connection connection = DriverManager.getConnection(dbUrl,
                env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setInt(1,job.getPositionCount());
            statement.setString(2,job.getDescription());
            statement.setString(3,job.getJobTitle());
            statement.setString(4,job.getSalary());
            statement.setString(5,job.getSmallDes());
            statement.setString(6,job.getResidency());
            statement.setString(7,job.getResidencyTitle());
            statement.setLong(8,job.getJobId());

            statement.executeUpdate();

        }catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }
    public static void approveJob(long jobId){
        String sql = "UPDATE job" +
                "SET approval = 'approved'  " +
                "WHERE job_id = ?";
        try (Connection connection = DriverManager.getConnection(dbUrl,
                env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setLong(1, jobId);
             statement.executeUpdate();

        }catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }
    public static void rejectJob(long jobId){
        String sql = "UPDATE job" +
                "SET approval = 'rejected'  " +
                "WHERE job_id = ?";
        try (Connection connection = DriverManager.getConnection(dbUrl,
                env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setLong(1, jobId);
            statement.executeUpdate();

        }catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }
    public  static String getResidency(int jobId) throws SQLException{
        String sql = "SELECT residency FROM job WHERE job_id = ?";
        //auto close db connection
        try (Connection connection = DriverManager.getConnection(dbUrl,
                env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, jobId);
            //if query fails
            try(ResultSet rs = statement.executeQuery();){
                if(rs.next()){
                String residency = rs.getString("residency");
                return residency;}
                //job doesn't exists
                else {
                    throw new SQLException();
                }

            }
        }
        //if connection fails
        catch (SQLException e) {
            e.printStackTrace();
            throw new SQLException();
        }
    }

    /**
     *
     * @param residency
     * @return all the associated jobs of a year
     */
    public static HashMap<Long,Job> getJobs(String residency) throws SQLException{

        //using prepared statements to prevent sql injections
        String sql = "SELECT job_id, company_id, position_count " +
                "FROM job " +
                "WHERE residency = ? AND approval = 'approved' ";
        HashMap<Long,Job> jobsMap = new HashMap<>();

        //automatic resource allocation
        try (Connection connection = DriverManager.getConnection(dbUrl,
                env.get("MYSQL_USER_NAME"), env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setString(1, residency);


            try(ResultSet rs = statement.executeQuery()){//
                while (rs.next()){
                    jobsMap.put(rs.getLong("job_id"),new Job(rs.getLong("job_id"),
                            rs.getLong("company_id"),rs.getInt("position_count")));
                }
            }
            return jobsMap;//
            //if a query fails or connection fails
        } catch (SQLException e) {
            e.printStackTrace();
            throw new SQLException();
        }
    }


}
