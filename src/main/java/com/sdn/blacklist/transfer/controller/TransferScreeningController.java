package com.sdn.blacklist.transfer.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sdn.blacklist.config.ApiVersion;
import com.sdn.blacklist.tenant.context.TenantContext;
import com.sdn.blacklist.transfer.dto.TransferScreeningRequest;
import com.sdn.blacklist.transfer.dto.TransferScreeningResponse;
import com.sdn.blacklist.transfer.dto.TransferStatsResponse;
import com.sdn.blacklist.transfer.service.TransferScreeningService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(ApiVersion.V1 + "/transfer")
@CrossOrigin(origins = {"https://risk-lens.net" , "https://api.risk-lens.net"})
@RequiredArgsConstructor
@Validated
@Tag(name = "Transfer Screening", description = "فحص الحوالات المالية")
public class TransferScreeningController {

    private final TransferScreeningService service;

    // ── Helper ──
    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a ->
            a.getAuthority().equals("ROLE_SUPER_ADMIN") ||
            a.getAuthority().equals("ROLE_COMPANY_ADMIN"));
    }

    // ── Screen ──
    @PostMapping("/screen")
    public ResponseEntity<TransferScreeningResponse> screen(
            @Valid @RequestBody TransferScreeningRequest req,
            Authentication auth) {
        // مرر اسم المستخدم (من JWT أو API Key)
        req.setCreatedBy(auth != null ? auth.getName() : "system");
        return ResponseEntity.ok(service.screen(req));
    }

    // ── History ──
    @GetMapping("/history")
    public ResponseEntity<Page<TransferScreeningResponse>> history(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication auth) {

        Long   tenantId = TenantContext.getTenantId();
        String username = auth.getName();

        if (tenantId == null) {
            // SUPER_ADMIN → كل البيانات
            return ResponseEntity.ok(service.getHistory(page, size));
        } else if (isAdmin(auth)) {
            // COMPANY_ADMIN → بيانات شركته
            return ResponseEntity.ok(service.getHistoryByTenant(tenantId, page, size));
        } else {
            // SUBSCRIBER → بياناته فقط
            return ResponseEntity.ok(service.getHistoryByUser(username, page, size));
        }
    }

    // ── Get by ID ──
    @GetMapping("/{id}")
    public ResponseEntity<TransferScreeningResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    // ── Get by Reference ──
    @GetMapping("/ref/{reference}")
    public ResponseEntity<TransferScreeningResponse> getByReference(@PathVariable String reference) {
        return ResponseEntity.ok(service.getByReference(reference));
    }

    // ── Stats ──
    @GetMapping("/stats")
    public ResponseEntity<TransferStatsResponse> stats(Authentication auth) {
        Long   tenantId = TenantContext.getTenantId();
        String username = auth.getName();

        if (tenantId == null) {
            return ResponseEntity.ok(service.getStats());
        } else if (isAdmin(auth)) {
            return ResponseEntity.ok(service.getStatsByTenant(tenantId));
        } else {
            return ResponseEntity.ok(service.getStatsByUser(username));
        }
    }
}