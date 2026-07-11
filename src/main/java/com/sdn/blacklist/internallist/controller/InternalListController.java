package com.sdn.blacklist.internallist.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.sdn.blacklist.config.ApiVersion;
import com.sdn.blacklist.internallist.entity.InternalListEntity;
import com.sdn.blacklist.internallist.service.InternalListService;
import com.sdn.blacklist.tenant.context.TenantContext;
import com.sdn.blacklist.user.entity.User;

import io.swagger.v3.oas.annotations.tags.Tag;

@CrossOrigin(origins = { "https://risk-lens.net", "https://api.risk-lens.net" })
@RestController
@RequestMapping(ApiVersion.V1 + "/internal-lists")
@Tag(name = "Internal Lists", description = "القوائم الداخلية الخاصة بكل شركة")
public class InternalListController {

    private final InternalListService service;

    public InternalListController(InternalListService service) {
        this.service = service;
    }

    // ══════════════════════════════════════════
    // ⚠️ بدّل هالميثود بنسخة resolveTenantId تبعك من WebhookController
    //     (نفس اللي عملناها سابقاً — بتقرأ tenantId من الـ JWT principal)
    // ══════════════════════════════════════════
    private Long resolveTenantId(Authentication auth) {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null && auth != null && auth.getPrincipal() instanceof User user) {
            tenantId = user.getTenantId();
        }
        return tenantId;   // ممكن ترجع null لـ SUPER_ADMIN — وهاد مقصود
    }

    // ── العرض/البحث: أي موظف بالشركة ──────────────
    @GetMapping
    public ResponseEntity<?> getAll(Authentication auth) {
        Long tenantId = resolveTenantId(auth);
        if (tenantId == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tenant context");
        return ResponseEntity.ok(service.findAll(tenantId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable UUID id, Authentication auth) {
        Long tenantId = resolveTenantId(auth);
        if (tenantId == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tenant context");
        return service.findById(id, tenantId)
                .map(e -> ResponseEntity.ok((Object) e))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Not found: " + id));
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(@RequestParam String q, Authentication auth) {
        Long tenantId = resolveTenantId(auth);
        if (tenantId == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tenant context");
        if (q == null || q.trim().isEmpty())
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Search query cannot be empty");
        return ResponseEntity.ok(service.search(q, tenantId));
    }

    @GetMapping("/stats/count")
    public ResponseEntity<Long> getCount(Authentication auth) {
        Long tenantId = resolveTenantId(auth);
        return ResponseEntity.ok(tenantId == null ? 0L : service.getTotalCount(tenantId));
    }

    @GetMapping("/check-duplicate")
    public ResponseEntity<?> checkDuplicate(@RequestParam String name, Authentication auth) {
        Long tenantId = resolveTenantId(auth);
        if (tenantId == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tenant context");
        if (name == null || name.trim().isEmpty())
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Name cannot be empty");
        return ResponseEntity.ok(service.isDuplicate(name, tenantId));
    }

    // ── الإدارة: مدير الشركة فقط ───────────────────
    @PreAuthorize("hasRole('COMPANY_ADMIN')")
    @PostMapping("/import")
    public ResponseEntity<?> importExcel(@RequestParam("file") MultipartFile file, Authentication auth) {
        Long tenantId = resolveTenantId(auth);
        if (tenantId == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tenant context");
        try {
            int saved = service.importFromExcel(file, tenantId);
            return ResponseEntity.ok(Map.of("saved", saved));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "فشل الاستيراد", "message", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('COMPANY_ADMIN')")
    @PostMapping
    public ResponseEntity<?> create(@RequestBody InternalListEntity entity, Authentication auth) {
        Long tenantId = resolveTenantId(auth);
        if (tenantId == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tenant context");
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(service.create(entity, tenantId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error creating: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('COMPANY_ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable UUID id, @RequestBody InternalListEntity entity, Authentication auth) {
        Long tenantId = resolveTenantId(auth);
        if (tenantId == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tenant context");
        try {
            return ResponseEntity.ok(service.update(id, entity, tenantId));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error updating: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('COMPANY_ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable UUID id, Authentication auth) {
        Long tenantId = resolveTenantId(auth);
        if (tenantId == null) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tenant context");
        try {
            service.delete(id, tenantId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error deleting: " + e.getMessage());
        }
    }
}