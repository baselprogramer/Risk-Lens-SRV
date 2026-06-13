package com.sdn.blacklist.webhook.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sdn.blacklist.tenant.context.TenantContext;
import com.sdn.blacklist.user.entity.User;
import com.sdn.blacklist.webhook.entity.WebhookConfig;
import com.sdn.blacklist.webhook.entity.WebhookDelivery;
import com.sdn.blacklist.webhook.service.WebhookService;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
@Tag(name = "Webhooks", description = "إدارة الـ Webhooks لكل tenant")
public class WebhookController {

    private final WebhookService webhookService;

    private Long resolveTenantId(Authentication auth) {
    Long tenantId = TenantContext.getTenantId();
    if (tenantId == null && auth != null) {
        User user = (User) auth.getPrincipal();
        tenantId = user.getTenantId();
    }
    // SUPER_ADMIN ما عندو tenant — نحطلو 0 كـ system tenant
    if (tenantId == null) {
        tenantId = 0L;
    }
    return tenantId;
}

   @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN')")
    public ResponseEntity<WebhookConfig> create(
            @RequestBody CreateWebhookRequest req,
            Authentication auth) {
        Long tenantId = resolveTenantId(auth);
        log.info("🔍 Webhook create: tenantId={} auth={} principal={}",
            tenantId, auth != null ? auth.getName() : "null",
            auth != null ? auth.getPrincipal().getClass().getSimpleName() : "null");
        return ResponseEntity.ok(
            webhookService.create(tenantId, req.url(), req.events(), req.secret())
        );
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN')")
    public ResponseEntity<List<WebhookConfig>> getAll(Authentication auth) {
        Long tenantId = resolveTenantId(auth);
        return ResponseEntity.ok(tenantId != null
            ? webhookService.getByTenant(tenantId)
            : webhookService.getAll());
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