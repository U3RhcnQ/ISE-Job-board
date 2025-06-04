package com.example.isejobsboard.controller.schemas;

public class Address {
    private Long AddressId;
    private String streetAddressLine1;
    private String  streetAddressLine2;
    private String city;
    private String postalCode;
    private String country;

    public Address(Long id, String streetAddressLine1, String streetAddressLine2, String city, String postalCode, String country) {
        this.AddressId = id;
        this.streetAddressLine1 = streetAddressLine1;
        this.streetAddressLine2 = streetAddressLine2;
        this.city = city;
        this.postalCode = postalCode;
        this.country = country;
    }

    public Long getId() {
        return AddressId;
    }

    public String getStreetAddressLine1() {
        return streetAddressLine1;
    }

    public String getStreetAddressLine2() {
        return streetAddressLine2;
    }

    public String getCity() {
        return city;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public String getCountry() {
        return country;
    }



}
