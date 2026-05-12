package com.sdn.blacklist.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sdn.blacklist.config.ApiVersion;
import com.sdn.blacklist.security.JwtService;
import com.sdn.blacklist.user.entity.User;
import com.sdn.blacklist.user.entity.UserRole;
import com.sdn.blacklist.user.repository.UserRepository;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(ApiVersion.V1 + "/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "تسجيل الدخول وإنشاء المستخدمين")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService            jwtService;
    private final UserRepository        userRepository;
    private final PasswordEncoder       passwordEncoder;

    // ── LOGIN ──
    @PostMapping("/authenticate")
    public ResponseEntity<?> authenticate(@RequestBody AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getUsername(), request.getPassword()
            )
        );

        User user    = (User) authentication.getPrincipal();
        String token = jwtService.generateToken(user);

        return ResponseEntity.ok(new AuthResponse(
            token,
            user.getUsername(),
            user.getRole().name(),
            user.getTenantId()   
        ));
    }

    // ── REGISTER — ADMIN + SUPER_ADMIN ──
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {

        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists");
        }

        UserRole role;
        try {
            role = UserRole.valueOf(request.getRole().toUpperCase());
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body("Invalid role. Use: SUPER_ADMIN, COMPANY_ADMIN, or SUBSCRIBER");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setTenantId(request.getTenantId()); 

        userRepository.save(user);

        return ResponseEntity.ok("User created: " + request.getUsername() + " [" + role + "]");
    }
}