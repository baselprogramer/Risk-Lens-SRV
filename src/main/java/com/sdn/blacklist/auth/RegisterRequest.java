package com.sdn.blacklist.auth;

import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String password;
    private String role;     
    private Long   tenantId;
}