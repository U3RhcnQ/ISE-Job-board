package com.example.isejobsboard.Utils;

import com.example.isejobsboard.model.Company;

import java.sql.*;

import com.example.isejobsboard.Utils.DatabaseUtils;

public class CompanyUtils {
    public static Company getCompanyInfoFromUserId(int userId) {
        Company company = new Company();

        String query =
                "SELECT c.* " +
                "FROM jobs_board.company c " +
                "INNER JOIN jobs_board.rep r ON c.company_id = r.Company_id " +
                "WHERE r.user_id = ?;";

        try (Connection con = DriverManager.getConnection(DatabaseUtils.url, DatabaseUtils.env.get("MYSQL_USER_NAME"), DatabaseUtils.env.get("MYSQL_USER_PASSWORD"));
             PreparedStatement statement = con.prepareStatement(query)) {

            statement.setInt(1, userId);

            ResultSet rs = statement.executeQuery();

            if (rs.next()) {
                company.id = rs.getInt("company_id");
                company.name = rs.getString("name");
                company.champion = rs.getString("champion");
                company.addressId = rs.getInt("address_id");
            } else {
                throw new SQLException("Company not found");
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }

        return company;
    }

    public static Company getCompanyInfoFromCompanyId(int companyId) {
        Company company = new Company();

        return company;
    }
}
