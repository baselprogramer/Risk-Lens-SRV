package com.sdn.blacklist.tenant.service;

import java.time.LocalDate;

import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sdn.blacklist.monitoring.service.MonitoringService;
import com.sdn.blacklist.tenant.context.TenantContext;
import com.sdn.blacklist.tenant.repository.TenantRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class RateLimitService {

    private final TenantRepository tenantRepository;
    private final MonitoringService monitoringService;

    public RateLimitService(TenantRepository tenantRepository,
                        @Lazy MonitoringService monitoringService) {
    this.tenantRepository  = tenantRepository;
    this.monitoringService = monitoringService;
}


    /**
     * يعدّ الطلب ويتحقق من الـ limit
     * يُستدعى من ScreeningService و TransferScreeningService
     */
    @Transactional
    public void countRequest() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) return; // SUPER_ADMIN — بدون limit

        tenantRepository.findById(tenantId).ifPresent(tenant -> {
            // ── Reset لو يوم جديد ──
            if (tenant.getLastResetAt() == null ||
                tenant.getLastResetAt().toLocalDate().isBefore(LocalDate.now())) {
                tenantRepository.resetRequestsToday(tenantId);
                log.debug("🔄 Rate limit counter reset for tenant: {}", tenantId);
            }

            // ── زود العداد ──
            tenantRepository.incrementRequestsToday(tenantId);

            tenantRepository.findById(tenantId).ifPresent(updated -> {
            monitoringService.checkRateLimit(
                updated.getId(),
                updated.getName(),
                updated.getRequestsToday(),
                updated.getDailyLimit()
            );
        });
            log.debug("📊 Request counted for tenant:{} — today:{}",
                tenantId, tenant.getRequestsToday() + 1);
        });
    }

    /**
     * تحقق من الـ limit قبل الـ screening
     * يرجع true لو مسموح، false لو تجاوز الـ limit
     */
    @Transactional(readOnly = true)
    public boolean isAllowed() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) return true; // SUPER_ADMIN — دائماً مسموح

        return tenantRepository.findById(tenantId).map(tenant -> {
            // reset لو يوم جديد
            if (tenant.getLastResetAt() == null ||
                tenant.getLastResetAt().toLocalDate().isBefore(LocalDate.now())) {
                return true; // يوم جديد → مسموح
            }
            return tenant.getRequestsToday() < tenant.getDailyLimit();
        }).orElse(true);
    }

    /**
     * جيب معلومات الـ rate limit الحالية
     */
    @Transactional(readOnly = true)
    public RateLimitInfo getInfo() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) return null;

        return tenantRepository.findById(tenantId).map(tenant -> {
            int used      = tenant.getRequestsToday();
            int limit     = tenant.getDailyLimit();
            int remaining = Math.max(0, limit - used);
            int percent   = limit > 0 ? (int) Math.round((double) used / limit * 100) : 0;
            return new RateLimitInfo(
                tenant.getPlan() != null ? tenant.getPlan().name() : "BASIC",
                limit, used, remaining, percent
            );
        }).orElse(null);
    }

    public record RateLimitInfo(
        String plan,
        int dailyLimit,
        int usedToday,
        int remaining,
        int usagePercent
    ) {}
}