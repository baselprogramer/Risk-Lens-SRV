package com.sdn.blacklist.webhook.dto;

import java.time.LocalDateTime;
import java.util.Map;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WebhookPayload {
    private String event;
    private LocalDateTime timestamp;
    private Long tenantId;
    private Map<String, Object> data;
}