package com.sdn.blacklist.tenant.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sdn.blacklist.config.ApiVersion;
import com.sdn.blacklist.tenant.entity.Tenant;
import com.sdn.blacklist.tenant.service.TenantService;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(ApiVersion.V1 + "/super/tenants")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Tenants", description = "إدارة الشركات — SUPER_ADMIN فقط")
public class TenantController {

    private final TenantService service;

    // ── إنشاء شركة ──
    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateTenantRequest req) {
        try {
            return ResponseEntity.ok(service.createTenant(
                req.name(), req.code(), req.email(),
                req.phone(), req.country(), req.plan(),
                req.expiryDays(), req.notes()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── كل الشركات ──
    @GetMapping
    public ResponseEntity<List<Tenant>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    // ── شركة واحدة ──
    @GetMapping("/{id}")
    public ResponseEntity<Tenant> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    // ── إحصائيات ──
    @GetMapping("/stats")
    public ResponseEntity<TenantService.TenantStats> getStats() {
        return ResponseEntity.ok(service.getStats());
    }

    // ── تحديث ──
    @PutMapping("/{id}")
    public ResponseEntity<Tenant> update(@PathVariable Long id, @RequestBody UpdateTenantRequest req) {
        return ResponseEntity.ok(service.updateTenant(
            id, req.name(), req.email(), req.phone(), req.plan(), req.active()
        ));
    }

    // ── تجديد الاشتراك ──
    @PutMapping("/{id}/renew")
    public ResponseEntity<Tenant> renew(@PathVariable Long id, @RequestBody RenewRequest req) {
        return ResponseEntity.ok(service.renewTenant(id, req.days()));
    }

    // ── تفعيل / تعطيل ──
    @PutMapping("/{id}/toggle")
    public ResponseEntity<Void> toggle(@PathVariable Long id, @RequestBody ToggleRequest req) {
        service.toggleTenant(id, req.active());
        return ResponseEntity.ok().build();
    }

    // ── حذف ──
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteTenant(id);
        return ResponseEntity.ok().build();
    }

    // ── Records ──
    public record CreateTenantRequest(
        String name, String code, String email,
        String phone, String country, String plan,
        Integer expiryDays, String notes
    ) {}

    public record UpdateTenantRequest(
        String name, String email, String phone,
        String plan, boolean active
    ) {}

    public record RenewRequest(int days) {}
    public record ToggleRequest(boolean active) {}
}