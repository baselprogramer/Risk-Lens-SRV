package com.sdn.blacklist.auth;

import lombok.AllArgsConstructor;
import lombok.Data;

// AuthResponse.java
@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String username;
    private String role;      
    private Long   tenantId;
}