package com.sdn.blacklist.tenant.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sdn.blacklist.tenant.entity.Tenant;
import com.sdn.blacklist.tenant.entity.TenantPlan;
import com.sdn.blacklist.tenant.repository.TenantRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository repository;

    // ── إنشاء شركة جديدة ──
    @Transactional
    public Tenant createTenant(String name, String code, String email,
                               String phone, String country, String plan,
                               Integer expiryDays, String notes) {

        if (repository.findByCode(code.toUpperCase()).isPresent()) {
            throw new RuntimeException("Company code already exists: " + code);
        }

        TenantPlan tenantPlan = plan != null
            ? TenantPlan.valueOf(plan.toUpperCase())
            : TenantPlan.BASIC;

        Tenant tenant = Tenant.builder()
            .name(name)
            .code(code.toUpperCase())
            .email(email)
            .phone(phone)
            .country(country)
            .active(true)
            .plan(tenantPlan)
            .dailyLimit(tenantPlan.getDailyLimit()) //  يتحدد تلقائياً من الـ plan
            .requestsToday(0)                       //  يبدأ من صفر
            .lastResetAt(LocalDateTime.now())       //  تاريخ الإنشاء
            .createdAt(LocalDateTime.now())
            .expiresAt(expiryDays != null ? LocalDateTime.now().plusDays(expiryDays) : null)
            .notes(notes)
            .build();

        Tenant saved = repository.save(tenant);
        log.info("✅ Tenant created: {} ({}) — plan:{} limit:{}/day",
            saved.getName(), saved.getCode(), tenantPlan, tenantPlan.getDailyLimit());
        return saved;
    }

    // ── تحديث ──
    @Transactional
    public Tenant updateTenant(Long id, String name, String email,
                               String phone, String plan, boolean active) {
        Tenant t = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Tenant not found: " + id));

        if (name  != null) t.setName(name);
        if (email != null) t.setEmail(email);
        if (phone != null) t.setPhone(phone);
        if (plan  != null) {
            TenantPlan newPlan = TenantPlan.valueOf(plan.toUpperCase());
            t.setPlan(newPlan);
            t.setDailyLimit(newPlan.getDailyLimit()); //  يحدث الـ limit تلقائياً
            t.setRequestsToday(0);                    //  reset العداد عند تغيير الخطة
            log.info("✅ Tenant {} plan updated to {} — new limit: {}/day",
                t.getName(), newPlan, newPlan.getDailyLimit());
        }
        t.setActive(active);
        return repository.save(t);
    }

    // ── تجديد الاشتراك ──
    @Transactional
    public Tenant renewTenant(Long id, int days) {
        Tenant t = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Tenant not found: " + id));

        LocalDateTime base = t.getExpiresAt() != null && t.getExpiresAt().isAfter(LocalDateTime.now())
            ? t.getExpiresAt()
            : LocalDateTime.now();
        t.setExpiresAt(base.plusDays(days));
        t.setActive(true);
        t.setRequestsToday(0); //  reset العداد عند التجديد
        log.info("✅ Tenant {} renewed for {} days", t.getName(), days);
        return repository.save(t);
    }

    // ── تعطيل / تفعيل ──
    @Transactional
    public void toggleTenant(Long id, boolean active) {
        Tenant t = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Tenant not found: " + id));
        t.setActive(active);
        repository.save(t);
        log.info("✅ Tenant {} → {}", t.getName(), active ? "ACTIVE" : "DISABLED");
    }

    // ── حذف ──
    @Transactional
    public void deleteTenant(Long id) {
        repository.deleteById(id);
    }

    // ── جلب ──
    public List<Tenant> getAll()         { return repository.findAllByOrderByCreatedAtDesc(); }
    public Tenant getById(Long id)       { return repository.findById(id).orElseThrow(() -> new RuntimeException("Not found")); }
    public Tenant getByCode(String code) { return repository.findByCode(code).orElseThrow(() -> new RuntimeException("Not found")); }

    // ── إحصائيات ──
    public TenantStats getStats() {
        return new TenantStats(
            repository.count(),
            repository.countByActive(true),
            repository.countByActive(false),
            repository.findExpiredTenants().size()
        );
    }

    // ── Helper ──
    private int getLimitForPlan(TenantPlan plan) {
        if (plan == null) return TenantPlan.BASIC.getDailyLimit();
        return plan.getDailyLimit();
    }

    public record TenantStats(long total, long active, long inactive, long expired) {}
}