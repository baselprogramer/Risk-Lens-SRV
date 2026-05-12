package com.sdn.blacklist.webhook.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sdn.blacklist.webhook.dto.WebhookPayload;
import com.sdn.blacklist.webhook.entity.WebhookConfig;
import com.sdn.blacklist.webhook.entity.WebhookDelivery;
import com.sdn.blacklist.webhook.repository.WebhookConfigRepository;
import com.sdn.blacklist.webhook.repository.WebhookDeliveryRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookService {

    private final WebhookConfigRepository configRepository;
    private final WebhookDeliveryRepository deliveryRepository;
    private final ObjectMapper objectMapper;

    private static final int MAX_RETRIES = 3;
    private static final int TIMEOUT_SECONDS = 10;

    // ── الأحداث المتاحة ──────────────────────────────────────────
    public static final String EVENT_SCREENING_HIGH     = "SCREENING_HIGH";
    public static final String EVENT_SCREENING_CRITICAL = "SCREENING_CRITICAL";
    public static final String EVENT_DECISION_CHANGED   = "DECISION_CHANGED";
    public static final String EVENT_TRANSFER_HIGH      = "TRANSFER_HIGH";

    // ── إرسال Webhook لكل الـ configs المفعّلة للـ tenant ──────
    @Async
    public void trigger(Long tenantId, String event, Map<String, Object> data) {
        List<WebhookConfig> configs = tenantId != null
            ? configRepository.findByTenantIdAndActiveTrue(tenantId)
            : configRepository.findByActiveTrue();

        for (WebhookConfig config : configs) {
            if (!config.getEvents().contains(event)) continue;
            sendWithRetry(config, event, data, 1);
        }
    }

    // ── الإرسال مع Retry ─────────────────────────────────────────
    private void sendWithRetry(WebhookConfig config, String event,
                                Map<String, Object> data, int attempt) {
        try {
            WebhookPayload payload = WebhookPayload.builder()
                .event(event)
                .timestamp(LocalDateTime.now())
                .tenantId(config.getTenantId())
                .data(data)
                .build();

            String body = objectMapper.writeValueAsString(payload);

            HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(TIMEOUT_SECONDS))
                .build();

            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                .uri(URI.create(config.getUrl()))
                .timeout(Duration.ofSeconds(TIMEOUT_SECONDS))
                .header("Content-Type", "application/json")
                .header("X-Webhook-Event", event)
                .header("X-Webhook-Attempt", String.valueOf(attempt))
                .POST(HttpRequest.BodyPublishers.ofString(body));

            // أضف signature لو في secret
            if (config.getSecret() != null && !config.getSecret().isBlank()) {
                String signature = sign(body, config.getSecret());
                requestBuilder.header("X-Webhook-Signature", signature);
            }

            HttpResponse<String> response = client.send(
                requestBuilder.build(),
                HttpResponse.BodyHandlers.ofString()
            );

            boolean success = response.statusCode() >= 200 && response.statusCode() < 300;

            // سجّل النتيجة
            saveDelivery(config, event, body, response.statusCode(),
                        response.body(), success, attempt);

            if (success) {
                config.setLastTriggeredAt(LocalDateTime.now());
                config.setFailureCount(0);
                configRepository.save(config);
                log.info("Webhook sent: event={} tenant={} status={}",
                    event, config.getTenantId(), response.statusCode());
            } else {
                handleFailure(config, event, data, attempt,
                    "HTTP " + response.statusCode());
            }

        } catch (Exception e) {
            log.error("Webhook failed: event={} attempt={} error={}",
                event, attempt, e.getMessage());
            saveDelivery(config, event, "", 0, e.getMessage(), false, attempt);
            handleFailure(config, event, data, attempt, e.getMessage());
        }
    }

    // ── Retry Logic ───────────────────────────────────────────────
    private void handleFailure(WebhookConfig config, String event,
                                Map<String, Object> data, int attempt, String error) {
        config.setFailureCount(config.getFailureCount() + 1);
        configRepository.save(config);

        if (attempt < MAX_RETRIES) {
            try {
                // انتظر قبل الـ retry: 5s, 15s, 30s
                int waitSeconds = attempt * 10 + 5;
                Thread.sleep(waitSeconds * 1000L);
                sendWithRetry(config, event, data, attempt + 1);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
            }
        } else {
            log.warn("Webhook gave up after {} attempts: tenant={} event={}",
                MAX_RETRIES, config.getTenantId(), event);
        }
    }

    // ── تسجيل كل محاولة في DB ─────────────────────────────────
    private void saveDelivery(WebhookConfig config, String event, String payload,
                               int statusCode, String responseBody,
                               boolean success, int attempt) {
        WebhookDelivery delivery = new WebhookDelivery();
        delivery.setWebhookConfigId(config.getId());
        delivery.setTenantId(config.getTenantId());
        delivery.setEvent(event);
        delivery.setPayload(payload);
        delivery.setStatusCode(statusCode);
        delivery.setSuccess(success);
        delivery.setAttempt(attempt);
        delivery.setResponseBody(responseBody);
        deliveryRepository.save(delivery);
    }

    // ── HMAC Signature ────────────────────────────────────────────
    private String sign(String payload, String secret) {
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            mac.init(new javax.crypto.spec.SecretKeySpec(
                secret.getBytes(), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return "sha256=" + sb;
        } catch (Exception e) {
            return "";
        }
    }

    // ── CRUD ──────────────────────────────────────────────────────
    public WebhookConfig create(Long tenantId, String url,
                                 List<String> events, String secret) {
        WebhookConfig config = new WebhookConfig();
        config.setTenantId(tenantId);
        config.setUrl(url);
        config.setEvents(String.join(",", events));
        config.setSecret(secret);
        config.setActive(true);
        return configRepository.save(config);
    }

    public List<WebhookConfig> getByTenant(Long tenantId) {
        return configRepository.findByTenantIdAndActiveTrue(tenantId);
    }

    public void delete(Long id) {
        configRepository.deleteById(id);
    }

    public List<WebhookDelivery> getDeliveries(Long webhookConfigId) {
        return deliveryRepository.findByWebhookConfigIdOrderByCreatedAtDesc(webhookConfigId);
    }
}