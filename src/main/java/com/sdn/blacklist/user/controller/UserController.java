package com.sdn.blacklist.user.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sdn.blacklist.config.ApiVersion;
import com.sdn.blacklist.tenant.context.TenantContext;
import com.sdn.blacklist.user.entity.User;
import com.sdn.blacklist.user.entity.UserRole;
import com.sdn.blacklist.user.repository.UserRepository;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(ApiVersion.V1 + "/admin/users")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Users", description = "إدارة المستخدمين والصلاحيات")
public class UserController {

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;

    // ── GET ALL — مع tenant filter ──
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers(Authentication auth) {
        Long tenantId = TenantContext.getTenantId();

        List<UserDTO> users;

        if (tenantId == null) {
            // SUPER_ADMIN — يشوف الكل
            users = userRepository.findAll()
                .stream()
                .map(u -> new UserDTO(u.getId(), u.getUsername(), u.getRole().name(), u.getTenantId()))
                .toList();
        } else {
            // COMPANY_ADMIN — يشوف SUBSCRIBER تابعين لنفس الـ tenant فقط
            users = userRepository.findByTenantId(tenantId)
                .stream()
                .filter(u -> u.getRole() == UserRole.SUBSCRIBER) // مشتركيه فقط
                .map(u -> new UserDTO(u.getId(), u.getUsername(), u.getRole().name(), u.getTenantId()))
                .toList();
        }

        return ResponseEntity.ok(users);
    }

    // ── UPDATE ROLE ──
    @PutMapping("/{id}/role")
    public ResponseEntity<?> updateRole(@PathVariable Long id, @RequestBody UpdateRoleRequest req) {
        User user = getSecureUser(id);
        if (user == null) return ResponseEntity.notFound().build();
        try {
            user.setRole(UserRole.valueOf(req.role().toUpperCase()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid role: " + req.role());
        }
        userRepository.save(user);
        return ResponseEntity.ok("Role updated");
    }

    // ── RESET PASSWORD ──
    @PutMapping("/{id}/password")
    public ResponseEntity<?> resetPassword(@PathVariable Long id, @RequestBody ResetPasswordRequest req) {
        User user = getSecureUser(id);
        if (user == null) return ResponseEntity.notFound().build();
        if (req.newPassword() == null || req.newPassword().length() < 6)
            return ResponseEntity.badRequest().body("Password must be at least 6 characters");
        user.setPassword(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
        return ResponseEntity.ok("Password reset");
    }

    // ── DELETE ──
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        User user = getSecureUser(id);
        if (user == null) return ResponseEntity.notFound().build();
        userRepository.deleteById(id);
        return ResponseEntity.ok("User deleted");
    }

    // ── تحقق إن الـ user ينتمي لنفس الـ tenant ──
    private User getSecureUser(Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return null;

        Long tenantId = TenantContext.getTenantId();
        if (tenantId != null && !tenantId.equals(user.getTenantId())) {
            throw new RuntimeException("Access denied to user: " + id);
        }
        return user;
    }

    // ── DTOs ──
    public record UserDTO(Long id, String username, String role, Long tenantId) {}
    public record UpdateRoleRequest(String role) {}
    public record ResetPasswordRequest(String newPassword) {}
}