package com.sdn.blacklist.apikey.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sdn.blacklist.apikey.entity.ApiKey;
import com.sdn.blacklist.apikey.service.ApiKeyService;
import com.sdn.blacklist.config.ApiVersion;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(ApiVersion.V1 + "/admin/api-keys")
@PreAuthorize("hasAnyRole('SUPER_ADMIN')") 
@RequiredArgsConstructor
@Tag(name = "API Keys", description = "إدارة مفاتيح الـ API — SUPER_ADMIN فقط")
public class ApiKeyController {

    private final ApiKeyService service;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateKeyRequest req, Authentication auth) {
        try {
            return ResponseEntity.ok(service.createKey(
                req.name(), req.description(), req.username(),
                auth.getName(), req.expiryDays(), req.allowedIps()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<ApiKeyResponse>> getAll() {
        return ResponseEntity.ok(
            service.getAllKeys().stream().map(ApiKeyResponse::from).collect(Collectors.toList())
        );
    }

    @PutMapping("/{id}/renew")
    public ResponseEntity<ApiKeyResponse> renew(@PathVariable Long id, @RequestBody RenewRequest req) {
        return ResponseEntity.ok(ApiKeyResponse.from(service.renewKey(id, req.days())));
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<Void> toggle(@PathVariable Long id, @RequestBody ToggleRequest req) {
        service.toggleKey(id, req.active());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteKey(id);
        return ResponseEntity.ok().build();
    }

    public record CreateKeyRequest(String name, String description, String username, int expiryDays, String allowedIps) {}
    public record RenewRequest(int days) {}
    public record ToggleRequest(boolean active) {}

    public record ApiKeyResponse(Long id, String keyPrefix, String name, String description,
        String username, String createdBy, boolean active, String createdAt, String expiresAt,
        String lastUsedAt, Long requestCount, String allowedIps, boolean expired, long daysRemaining) {

        public static ApiKeyResponse from(ApiKey k) {
            boolean expired = k.getExpiresAt() != null &&
                java.time.LocalDateTime.now().isAfter(k.getExpiresAt());
            long daysRemaining = k.getExpiresAt() != null
                ? java.time.temporal.ChronoUnit.DAYS.between(java.time.LocalDateTime.now(), k.getExpiresAt())
                : -1;
            return new ApiKeyResponse(
                k.getId(), k.getKeyPrefix(), k.getName(), k.getDescription(),
                k.getUsername(), k.getCreatedBy(), k.isActive(),
                k.getCreatedAt()  != null ? k.getCreatedAt().toString()  : null,
                k.getExpiresAt()  != null ? k.getExpiresAt().toString()  : null,
                k.getLastUsedAt() != null ? k.getLastUsedAt().toString() : null,
                k.getRequestCount(), k.getAllowedIps(), expired, Math.max(0, daysRemaining)
            );
        }
    }
}