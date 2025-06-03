package com.example.isejobsboard.controller.schemas;

public class RepUser extends User{
    public Long repId;
    public Long companyId;
    public String companyName;

    public RepUser(Long userId, String firstName, String lastName, String email, Long repId, Long companyId, String companyName) {
        super(userId, firstName, lastName, email);
        this.repId = repId;
        this.companyId = companyId;
        this.companyName = companyName;
    }
}
