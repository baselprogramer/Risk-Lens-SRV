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

    // ══════════════════════════════════════════
    //  إنشاء API Key جديد
    // ══════════════════════════════════════════
    @Transactional
    public ApiKeyCreatedResponse createKey(String name, String description,
                                           String username, String createdBy,
                                           int expiryDays, String allowedIps) {

        Long tenantId = TenantContext.getTenantId(); 

        // تحقق ما في key فعّال لنفس المشترك
        repository.findActiveByUsername(username).ifPresent(existing -> {
            throw new RuntimeException("المشترك " + username + " عنده key فعّال بينتهي "
                + existing.getExpiresAt().toLocalDate());
        });

        String rawKey    = generateRawKey();
        String keyHash   = hashKey(rawKey);
        String keyPrefix = rawKey.substring(0, 16);

        ApiKey apiKey = ApiKey.builder()
            .keyHash(keyHash)
            .keyPrefix(keyPrefix)
            .name(name)
            .description(description)
            .username(username)
            .createdBy(createdBy)
            .active(true)
            .createdAt(LocalDateTime.now())
            .expiresAt(LocalDateTime.now().plusDays(expiryDays))
            .requestCount(0L)
            .allowedIps(allowedIps)
            .tenantId(tenantId) 
            .build();

        repository.save(apiKey);
        log.info("✅ API Key created for '{}' — expires in {} days by {} [tenant:{}]",
            username, expiryDays, createdBy, tenantId);

        return new ApiKeyCreatedResponse(
            rawKey, keyPrefix, name, username,
            LocalDateTime.now().plusDays(expiryDays).toLocalDate().toString()
        );
    }

    // ══════════════════════════════════════════
    //  التحقق من الـ Key
    // ══════════════════════════════════════════
    public Optional<ApiKey> validateKey(String rawKey) {
        if (rawKey == null || rawKey.isBlank()) return Optional.empty();

        String keyHash = hashKey(rawKey.trim());
        Optional<ApiKey> keyOpt = repository.findByKeyHash(keyHash);
        if (keyOpt.isEmpty()) return Optional.empty();

        ApiKey key = keyOpt.get();

        if (!key.isActive()) {
            log.warn("⚠️ Inactive key: {}", key.getKeyPrefix());
            return Optional.empty();
        }

        if (LocalDateTime.now().isAfter(key.getExpiresAt())) {
            log.warn("⚠️ Expired key for '{}' — expired: {}", key.getUsername(), key.getExpiresAt());
            key.setActive(false);
            repository.save(key);
            return Optional.empty();
        }

        repository.updateLastUsed(key.getId());
        return Optional.of(key);
    }

    // ══════════════════════════════════════════
    //  تجديد الاشتراك
    // ══════════════════════════════════════════
    @Transactional
    public ApiKey renewKey(Long id, int days) {
        ApiKey key = getSecureKey(id);

        LocalDateTime newExpiry = key.getExpiresAt() != null
            && key.getExpiresAt().isAfter(LocalDateTime.now())
            ? key.getExpiresAt().plusDays(days)
            : LocalDateTime.now().plusDays(days);

        key.setExpiresAt(newExpiry);
        key.setActive(true);
        ApiKey saved = repository.save(key);
        log.info("✅ Key renewed for '{}' — new expiry: {}", key.getUsername(), newExpiry.toLocalDate());
        return saved;
    }

    // ══════════════════════════════════════════
    //  تفعيل / تعطيل
    // ══════════════════════════════════════════
    @Transactional
    public void toggleKey(Long id, boolean active) {
        ApiKey key = getSecureKey(id);
        key.setActive(active);
        repository.save(key);
        log.info("✅ Key {} → {}", key.getKeyPrefix(), active ? "ACTIVE" : "DISABLED");
    }

    // ══════════════════════════════════════════
    //  حذف
    // ══════════════════════════════════════════
    @Transactional
    public void deleteKey(Long id) {
        getSecureKey(id); // تحقق من الـ tenant أولاً
        repository.deleteById(id);
    }

    // ══════════════════════════════════════════
    //  جلب — مع tenant filter
    // ══════════════════════════════════════════
    public List<ApiKey> getAllKeys() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            // SUPER_ADMIN — يشوف كل الـ keys
            return repository.findAllByOrderByCreatedAtDesc();
        }
        // غيره — keys الـ tenant فقط
        return repository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    public Optional<ApiKey> getKeyByUsername(String username) {
        return repository.findActiveByUsername(username);
    }

    // ══════════════════════════════════════════
    //  Helpers
    // ══════════════════════════════════════════

    // تحقق إن الـ key ينتمي لنفس الـ tenant
    private ApiKey getSecureKey(Long id) {
        ApiKey key = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Key not found: " + id));
        Long tenantId = TenantContext.getTenantId();
        if (tenantId != null && !tenantId.equals(key.getTenantId())) {
            throw new RuntimeException("Access denied to key: " + id);
        }
        return key;
    }

    private String generateRawKey() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        String random = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        return "ak_live_" + random.substring(0, 32);
    }

    public String hashKey(String rawKey) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash API key", e);
        }
    }

    public record ApiKeyCreatedResponse(
        String rawKey,
        String keyPrefix,
        String name,
        String username,
        String expiresAt
    ) {}
}