package com.sdn.blacklist.webhook.repository;

import com.sdn.blacklist.webhook.entity.WebhookConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WebhookConfigRepository extends JpaRepository<WebhookConfig, Long> {
    List<WebhookConfig> findByTenantIdAndActiveTrue(Long tenantId);
    List<WebhookConfig> findByActiveTrue();
}