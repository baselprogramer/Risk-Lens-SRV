package com.sdn.blacklist.riskconfig.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sdn.blacklist.riskconfig.entity.TenantRiskConfig;
import com.sdn.blacklist.riskconfig.repository.TenantRiskConfigRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * إعدادات محرّك المخاطر per-tenant — المرحلة 1: عتبة التشابه فقط.
 *
 * مبدأ الـ threading: الـ tenantId يُمرَّر by-value (مش يُقرأ من TenantContext هنا)،
 * لأن الـ ThreadLocal ما بينتقل للـ virtual threads. الـ caller يحلّ الـ tenantId
 * على thread الطلب ويمرّرو — نفس نمط BlockPolicyService.check().
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TenantRiskConfigService {

    public static final double DEFAULT_SIMILARITY_THRESHOLD = 75.0;
    public static final double MIN_SIMILARITY_THRESHOLD     = 50.0;
    public static final double MAX_SIMILARITY_THRESHOLD     = 100.0;

    private final TenantRiskConfigRepository repository;

    // ══════════════════════════════════════════════════════════
    //  HOT PATH — قراءة فقط، بلا كتابة (كل فحص + كل اسم بالـ batch)
    // ══════════════════════════════════════════════════════════

    /**
     * عتبة التشابه للشركة. تُستدعى على thread الطلب قبل أي عمل async، ثم القيمة
     * تُمرَّر بالـ value لـ search().
     * - tenantId == null (SUPER_ADMIN / warm-up) → default 75.0
     * - ما في صف config → default 75.0 (دفاعي، ما بيرمي — الفحص ما بيوقف بسبب config)
     * - قيمة خارج [50,100] (ما بتصير عادةً بسبب الـ CHECK) → تُقصّ للمدى
     *
     * ⚠️ بالـ batch: نادِ هالميثود **مرة وحدة** على thread الطلب ومرّر النتيجة للّوب،
     *    مش لكل اسم — تجنّباً لـ N قراءات DB لنفس الشركة.
     */
    public double getSimilarityThreshold(Long tenantId) {
        if (tenantId == null) return DEFAULT_SIMILARITY_THRESHOLD;

        return repository.findByTenantId(tenantId)
                .map(TenantRiskConfig::getSimilarityThreshold)
                .map(this::clampThreshold)
                .orElseGet(() -> {
                    log.warn("⚠️ No tenant_risk_config for tenant {} — using default {}",
                            tenantId, DEFAULT_SIMILARITY_THRESHOLD);
                    return DEFAULT_SIMILARITY_THRESHOLD;
                });
    }

    // ══════════════════════════════════════════════════════════
    //  COLD PATH — البانل (admin فقط)
    // ══════════════════════════════════════════════════════════

    /** إعدادات الشركة الكاملة (GET للبانل). getOrCreate: أول قراءة بتنشئ صف default. */
    @Transactional
    public TenantRiskConfig getConfig(Long tenantId) {
        requireTenant(tenantId);
        return repository.findByTenantId(tenantId)
                .orElseGet(() -> createDefault(tenantId));
    }

    /** تعديل عتبة التشابه (PUT للبانل). الصلاحية (COMPANY_ADMIN) تُفرض بالـ controller. */
    @Transactional
    public TenantRiskConfig updateSimilarityThreshold(Long tenantId, double threshold) {
        requireTenant(tenantId);
        if (threshold < MIN_SIMILARITY_THRESHOLD || threshold > MAX_SIMILARITY_THRESHOLD) {
            throw new RuntimeException("Similarity threshold must be between "
                    + (int) MIN_SIMILARITY_THRESHOLD + " and " + (int) MAX_SIMILARITY_THRESHOLD);
        }
        TenantRiskConfig config = repository.findByTenantId(tenantId)
                .orElseGet(() -> createDefault(tenantId));
        config.setSimilarityThreshold(threshold);
        TenantRiskConfig saved = repository.save(config);
        log.info("✅ Updated similarity_threshold to {} for tenant {}", threshold, tenantId);
        return saved;
    }

    // ══════════════════════════════════════════════════════════
    //  helpers
    // ══════════════════════════════════════════════════════════

    private TenantRiskConfig createDefault(Long tenantId) {
        TenantRiskConfig config = TenantRiskConfig.builder()
                .tenantId(tenantId)
                .similarityThreshold(DEFAULT_SIMILARITY_THRESHOLD)
                .build();
        TenantRiskConfig saved = repository.save(config);
        log.info("✅ Created default tenant_risk_config for tenant {}", tenantId);
        return saved;
    }

    private double clampThreshold(double v) {
        return Math.max(MIN_SIMILARITY_THRESHOLD, Math.min(MAX_SIMILARITY_THRESHOLD, v));
    }

    private void requireTenant(Long tenantId) {
        if (tenantId == null) {
            throw new RuntimeException("Tenant context required for risk config operation");
        }
    }
}