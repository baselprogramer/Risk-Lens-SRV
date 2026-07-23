package com.sdn.blacklist.riskconfig.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sdn.blacklist.config.ApiVersion;
import com.sdn.blacklist.riskconfig.entity.TenantRiskConfig;
import com.sdn.blacklist.riskconfig.service.TenantRiskConfigService;
import com.sdn.blacklist.user.entity.User;

import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * إعدادات محرّك المخاطر للشركة — بانل COMPANY_ADMIN.
 * المرحلة 1: عتبة التشابه فقط. المراحل الجاية بتضيف endpoints تحت نفس الـ resource
 * (مثلاً PUT /risk-config/risk-thresholds، PUT /risk-config/weights).
 *
 * الـ tenantId بيجي من المستخدم المصادَق (COMPANY_ADMIN عندو tenantId دايماً)،
 * وبينمرّر by-value للـ service — لا قراءة TenantContext داخل الـ service.
 */
@RestController
@RequestMapping(ApiVersion.V1 + "/risk-config")
@CrossOrigin(origins = { "https://risk-lens.net", "https://api.risk-lens.net" })
@PreAuthorize("hasRole('COMPANY_ADMIN')")
@Tag(name = "Risk Config", description = "إعدادات محرّك المخاطر للشركة")
public class TenantRiskConfigController {

    private final TenantRiskConfigService service;

    public TenantRiskConfigController(TenantRiskConfigService service) {
        this.service = service;
    }

    // إعدادات الشركة الحالية + حدود الـ slider (للبانل)
    @GetMapping
    public RiskConfigResponse getConfig(@AuthenticationPrincipal User user) {
        TenantRiskConfig config = service.getConfig(user.getTenantId());
        return RiskConfigResponse.from(config);
    }

    // تعديل عتبة التشابه — الـ validation (50–100) بتتم بالـ service
    @PutMapping("/similarity-threshold")
    public RiskConfigResponse updateSimilarityThreshold(
            @AuthenticationPrincipal User user,
            @RequestBody ThresholdUpdateRequest req) {

        TenantRiskConfig updated = service
                .updateSimilarityThreshold(user.getTenantId(), req.similarityThreshold());
        return RiskConfigResponse.from(updated);
    }

    // ── DTOs (inner records) ──────────────────────────────────

    public record ThresholdUpdateRequest(double similarityThreshold) {}

    public record RiskConfigResponse(
            double similarityThreshold,
            double minThreshold,
            double maxThreshold,
            double defaultThreshold) {

        static RiskConfigResponse from(TenantRiskConfig c) {
            return new RiskConfigResponse(
                    c.getSimilarityThreshold(),
                    TenantRiskConfigService.MIN_SIMILARITY_THRESHOLD,
                    TenantRiskConfigService.MAX_SIMILARITY_THRESHOLD,
                    TenantRiskConfigService.DEFAULT_SIMILARITY_THRESHOLD);
        }
    }
}