package com.sdn.blacklist.webhook.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sdn.blacklist.tenant.context.TenantContext;
import com.sdn.blacklist.webhook.entity.WebhookConfig;
import com.sdn.blacklist.webhook.entity.WebhookDelivery;
import com.sdn.blacklist.webhook.service.WebhookService;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
@Tag(name = "Webhooks", description = "إدارة الـ Webhooks لكل tenant")
public class WebhookController {

    private final WebhookService webhookService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN')")
    public ResponseEntity<WebhookConfig> create(@RequestBody CreateWebhookRequest req) {
        Long tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(
            webhookService.create(tenantId, req.url(), req.events(), req.secret())
        );
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN')")
    public ResponseEntity<List<WebhookConfig>> getAll() {
        Long tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(webhookService.getByTenant(tenantId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        webhookService.delete(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/deliveries")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN')")
    public ResponseEntity<List<WebhookDelivery>> getDeliveries(@PathVariable Long id) {
        return ResponseEntity.ok(webhookService.getDeliveries(id));
    }

    public record CreateWebhookRequest(
        String url,
        List<String> events,
        String secret
    ) {}
}