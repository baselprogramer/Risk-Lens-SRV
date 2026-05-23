package com.sdn.blacklist.apikey.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sdn.blacklist.apikey.entity.ApiKey;
import com.sdn.blacklist.apikey.repository.ApiKeyRepository;
import com.sdn.blacklist.tenant.context.TenantContext;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private final ApiKeyRepository repository;

    @Transactional
    public ApiKeyCreatedResponse createKey(String name, String description,
                                           String username, String createdBy,
                                           int expiryDays, String allowedIps,
                                           Long requestedTenantId) {

        // ✅ SUPER_ADMIN → tenantId من الـ request
        // غيره → tenantId من الـ context
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null && requestedTenantId != null) {
            tenantId = requestedTenantId;
        }

        // تحقق ما في key فعّال لنفس الـ tenant
        if (tenantId != null) {
            final Long finalTenantId = tenantId;
            repository.findActiveByTenantId(tenantId).ifPresent(existing -> {
                throw new RuntimeException(
                    "هذه الشركة عندها key فعّال بينتهي " +
                    existing.getExpiresAt().toLocalDate() +
                    " — جدّده بدل ما تنشئ key جديد");
            });
        }

        String rawKey    = generateRawKey();
        String keyHash   = hashKey(rawKey);
        String keyPrefix = rawKey.substring(0, 16);

        String effectiveUsername = (username != null && !username.isBlank())
            ? username : name;

        ApiKey apiKey = ApiKey.builder()
            .keyHash(keyHash)
            .keyPrefix(keyPrefix)
            .name(name)
            .description(description)
            .username(effectiveUsername)
            .createdBy(createdBy)
            .active(true)
            .createdAt(LocalDateTime.now())
            .expiresAt(LocalDateTime.now().plusDays(expiryDays))
            .requestCount(0L)
            .allowedIps(allowedIps)
            .tenantId(tenantId)
            .build();

        repository.save(apiKey);
        log.info("✅ API Key created for tenant={} name='{}' by={} expires={}d",
            tenantId, name, createdBy, expiryDays);

        return new ApiKeyCreatedResponse(
            rawKey, keyPrefix, name, effectiveUsername,
            LocalDateTime.now().plusDays(expiryDays).toLocalDate().toString()
        );
    }

    public Optional<ApiKey> validateKey(String rawKey) {
        if (rawKey == null || rawKey.isBlank()) return Optional.empty();
        String keyHash = hashKey(rawKey.trim());
        Optional<ApiKey> keyOpt = repository.findByKeyHash(keyHash);
        if (keyOpt.isEmpty()) return Optional.empty();
        ApiKey key = keyOpt.get();
        if (!key.isActive()) { log.warn("⚠️ Inactive key: {}", key.getKeyPrefix()); return Optional.empty(); }
        if (LocalDateTime.now().isAfter(key.getExpiresAt())) {
            log.warn("⚠️ Expired key — prefix={}", key.getKeyPrefix());
            key.setActive(false); repository.save(key); return Optional.empty();
        }
        repository.updateLastUsed(key.getId());
        return Optional.of(key);
    }

    @Transactional
    public ApiKey renewKey(Long id, int days) {
        ApiKey key = getSecureKey(id);
        LocalDateTime newExpiry = key.getExpiresAt() != null && key.getExpiresAt().isAfter(LocalDateTime.now())
            ? key.getExpiresAt().plusDays(days) : LocalDateTime.now().plusDays(days);
        key.setExpiresAt(newExpiry); key.setActive(true);
        ApiKey saved = repository.save(key);
        log.info("✅ Key renewed — prefix={} new expiry={}", key.getKeyPrefix(), newExpiry.toLocalDate());
        return saved;
    }

    @Transactional
    public void toggleKey(Long id, boolean active) {
        ApiKey key = getSecureKey(id); key.setActive(active); repository.save(key);
        log.info("✅ Key {} → {}", key.getKeyPrefix(), active ? "ACTIVE" : "DISABLED");
    }

    @Transactional
    public void deleteKey(Long id) { getSecureKey(id); repository.deleteById(id); }

    public List<ApiKey> getAllKeys() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) return repository.findAllByOrderByCreatedAtDesc();
        return repository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    public Optional<ApiKey> getKeyByUsername(String username) {
        return repository.findActiveByUsername(username);
    }

    private ApiKey getSecureKey(Long id) {
        ApiKey key = repository.findById(id).orElseThrow(() -> new RuntimeException("Key not found: " + id));
        Long tenantId = TenantContext.getTenantId();
        if (tenantId != null && !tenantId.equals(key.getTenantId()))
            throw new RuntimeException("Access denied to key: " + id);
        return key;
    }

    private String generateRawKey() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return "ak_live_" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes).substring(0, 32);
    }

    public String hashKey(String rawKey) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) { throw new RuntimeException("Failed to hash API key", e); }
    }

    public record ApiKeyCreatedResponse(String rawKey, String keyPrefix, String name, String username, String expiresAt) {}
}