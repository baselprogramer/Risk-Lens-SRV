package com.sdn.blacklist.webhook.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sdn.blacklist.webhook.entity.WebhookDelivery;

public interface WebhookDeliveryRepository extends JpaRepository<WebhookDelivery, Long> {
    List<WebhookDelivery> findByWebhookConfigIdOrderByCreatedAtDesc(Long webhookConfigId);
    List<WebhookDelivery> findByTenantIdOrderByCreatedAtDesc(Long tenantId);
}