package com.sdn.blacklist.tenant.filter;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.sdn.blacklist.apikey.entity.ApiKey;
import com.sdn.blacklist.apikey.service.ApiKeyService;
import com.sdn.blacklist.tenant.entity.Tenant;
import com.sdn.blacklist.tenant.repository.TenantRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Order(1) // قبل كل الـ filters
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final TenantRepository tenantRepository;
    private final ApiKeyService    apiKeyService;

    private static final String API_KEY_HEADER = "X-API-Key";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // فقط الـ API Key requests تخضع للـ rate limiting
        String rawKey = request.getHeader(API_KEY_HEADER);
        if (rawKey == null || rawKey.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        // جيب الـ API Key
        var keyOpt = apiKeyService.validateKey(rawKey);
        if (keyOpt.isEmpty()) {
            // ApiKeyAuthFilter رح يتعامل مع هذا
            filterChain.doFilter(request, response);
            return;
        }

        ApiKey key = keyOpt.get();
        Long tenantId = key.getTenantId();

        if (tenantId == null) {
            filterChain.doFilter(request, response);
            return;
        }

        // جيب الـ tenant
        var tenantOpt = tenantRepository.findById(tenantId);
        if (tenantOpt.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        Tenant tenant = tenantOpt.get();

        // ── Reset العداد لو يوم جديد ──
        if (tenant.getLastResetAt() == null ||
            tenant.getLastResetAt().toLocalDate().isBefore(LocalDate.now())) {
            tenant.setRequestsToday(0);
            tenant.setLastResetAt(LocalDateTime.now());
            tenantRepository.save(tenant);
        }

        // ── تحقق من الـ limit ──
        int limit = tenant.getDailyLimit();
        int used  = tenant.getRequestsToday();

        if (used >= limit) {
            log.warn("⚠️ Rate limit exceeded — tenant:{} used:{}/{}", tenant.getCode(), used, limit);
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write(String.format("""
                {
                  "error": "Daily limit reached",
                  "plan": "%s",
                  "limit": %d,
                  "used": %d,
                  "resetAt": "%s",
                  "message": "Upgrade your plan for more requests"
                }
                """,
                tenant.getPlan() != null ? tenant.getPlan().name() : "BASIC",
                limit, used,
                LocalDate.now().plusDays(1) + "T00:00:00"
            ));
            return;
        }

        // ── زود العداد ──
        tenant.setRequestsToday(used + 1);
        tenantRepository.save(tenant);

        // ✅ أضف headers في الرد
        response.setHeader("X-RateLimit-Limit",     String.valueOf(limit));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(limit - used - 1));
        response.setHeader("X-RateLimit-Reset",     LocalDate.now().plusDays(1) + "T00:00:00");

        log.debug("✅ Rate limit OK — tenant:{} used:{}/{}", tenant.getCode(), used + 1, limit);
        filterChain.doFilter(request, response);
    }
}