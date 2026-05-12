package com.sdn.blacklist.apikey.filter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.sdn.blacklist.apikey.entity.ApiKey;
import com.sdn.blacklist.apikey.service.ApiKeyService;
import com.sdn.blacklist.tenant.context.TenantContext;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private final ApiKeyService apiKeyService;
    private static final String API_KEY_HEADER = "X-API-Key";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String apiKey = request.getHeader(API_KEY_HEADER);

        // لا يوجد API Key → خلي الـ JWT filter يشتغل
        if (apiKey == null || apiKey.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        Optional<ApiKey> validKey = apiKeyService.validateKey(apiKey);

        if (validKey.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("""
                {"error":"Invalid or expired API Key","status":401,
                 "message":"Your subscription may have expired. Contact your administrator."}
                """);
            return;
        }

        ApiKey key = validKey.get();

        // تحقق من الـ IP whitelist
        if (!isIpAllowed(key, request.getRemoteAddr())) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"IP not allowed\",\"status\":403}");
            return;
        }

        //  ضع tenantId في TenantContext عشان البيانات تتفلتر صح
        if (key.getTenantId() != null) {
            TenantContext.setTenantId(key.getTenantId());
            log.debug("✅ TenantContext set from API Key: tenantId={}", key.getTenantId());
        }

        // Set authentication — باسم المشترك الفعلي المرتبط بالـ key
        var auth = new UsernamePasswordAuthenticationToken(
            key.getUsername(),
            null,
            List.of(new SimpleGrantedAuthority("ROLE_SUBSCRIBER"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        log.debug("✅ API Key auth: user='{}' key='{}' tenant='{}' IP='{}'",
            key.getUsername(), key.getKeyPrefix(), key.getTenantId(), request.getRemoteAddr());

        try {
            filterChain.doFilter(request, response);
        } finally {
            //  مهم — امسح الـ TenantContext بعد الطلب
            TenantContext.clear();
        }
    }

    private boolean isIpAllowed(ApiKey key, String remoteIp) {
        if (key.getAllowedIps() == null || key.getAllowedIps().isBlank()) return true;
        for (String ip : key.getAllowedIps().split(",")) {
            if (ip.trim().equals(remoteIp)) return true;
        }
        return false;
    }
}