package com.sdn.blacklist.auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data // تولد getters و setters و toString و equals/hashCode
@NoArgsConstructor // constructor بدون arguments
@AllArgsConstructor // constructor بكل الـ fields
public class AuthRequest {
    private String username;
    private String password;
}