package com.safora.backend.dto;

public class AuthResponse {
    private String token;
    private Long userId;
    private String name;
    private String email;

    public AuthResponse() {
    }

    public AuthResponse(
            String token,
            Long userId,
            String name,
            String email) {
        this.token = token;
        this.userId = userId;
        this.name = name;
        this.email = email;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}