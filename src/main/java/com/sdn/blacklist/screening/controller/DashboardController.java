package com.sdn.blacklist.screening.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sdn.blacklist.config.ApiVersion;
import com.sdn.blacklist.screening.model.RiskLevel;
import com.sdn.blacklist.screening.model.ScreeningResult;
import com.sdn.blacklist.screening.repository.ScreeningRequestRepository;
import com.sdn.blacklist.screening.repository.ScreeningResultRepository;
import com.sdn.blacklist.tenant.context.TenantContext;
import com.sdn.blacklist.tenant.repository.TenantRepository;
import com.sdn.blacklist.transfer.repository.TransferScreeningRepository;

import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping(ApiVersion.V1 + "/dashboard")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN','COMPLIANCE_MANAGER','COMPLIANCE_OFFICER','BRANCH_MANAGER','TELLER')")
@Tag(name = "Dashboard", description = "إحصائيات ونشاط النظام")
public class DashboardController {

    private final ScreeningRequestRepository requestRepo;
    private final ScreeningResultRepository  resultRepo;
    private final TenantRepository           tenantRepo;
    private final TransferScreeningRepository transferRepo;


    public DashboardController(ScreeningRequestRepository requestRepo,
                           ScreeningResultRepository  resultRepo,
                           TenantRepository           tenantRepo,
                           TransferScreeningRepository transferRepo) {
    this.requestRepo  = requestRepo;
    this.resultRepo   = resultRepo;
    this.tenantRepo   = tenantRepo;
    this.transferRepo = transferRepo;
}

    @GetMapping
    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardData() {
        Map<String, Object> data = new HashMap<>();

        Authentication auth     = SecurityContextHolder.getContext().getAuthentication();
        String         username = auth.getName();
        Long           tenantId = TenantContext.getTenantId();

        boolean isSuperAdmin   = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
        boolean isCompanyAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_COMPANY_ADMIN"));

        LocalDateTime startOfDay  = LocalDate.now().atStartOfDay();
        LocalDateTime sixMonthsAgo = LocalDateTime.now().minusMonths(6).withDayOfMonth(1).toLocalDate().atStartOfDay();

        // ── Stats ──
        long totalSearches, highRisk, mediumRisk, lowRisk, todaySearches;

        if (isSuperAdmin) {
            totalSearches = requestRepo.count() + transferRepo.count(); // ← أضف transfer
            highRisk      = resultRepo.countByRiskLevel(RiskLevel.HIGH);
            mediumRisk    = resultRepo.countByRiskLevel(RiskLevel.MEDIUM);
            lowRisk       = resultRepo.countByRiskLevel(RiskLevel.LOW);
            todaySearches = requestRepo.countByCreatedAtAfter(startOfDay); // transfer today اختياري

        } else if (isCompanyAdmin && tenantId != null) {
            totalSearches = requestRepo.countByTenantId(tenantId)
                        + transferRepo.countByTenantId(tenantId); // ← أضف transfer
            highRisk      = resultRepo.countByTenantIdAndRiskLevel(tenantId, RiskLevel.HIGH);
            mediumRisk    = resultRepo.countByTenantIdAndRiskLevel(tenantId, RiskLevel.MEDIUM);
            lowRisk       = resultRepo.countByTenantIdAndRiskLevel(tenantId, RiskLevel.LOW);
            todaySearches = requestRepo.countByTenantIdAndCreatedAtAfter(tenantId, startOfDay)
                        + transferRepo.countTodayByTenant(tenantId, startOfDay, LocalDateTime.now()); // ← أضف transfer

        } else {
            totalSearches = requestRepo.countByCreatedBy_Username(username)
                        + transferRepo.countByCreatedBy(username); // ← أضف transfer
            highRisk      = resultRepo.countByRequest_CreatedBy_UsernameAndRiskLevel(username, RiskLevel.HIGH);
            mediumRisk    = resultRepo.countByRequest_CreatedBy_UsernameAndRiskLevel(username, RiskLevel.MEDIUM);
            lowRisk       = resultRepo.countByRequest_CreatedBy_UsernameAndRiskLevel(username, RiskLevel.LOW);
            todaySearches = requestRepo.countByCreatedBy_UsernameAndCreatedAtAfter(username, startOfDay)
                        + transferRepo.countTodayByUser(username, startOfDay, LocalDateTime.now()); // ← أضف transfer
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSearches",   totalSearches);
        stats.put("todaySearches",   todaySearches);
        stats.put("positiveMatches", highRisk + mediumRisk);
        stats.put("highRisk",        highRisk);
        stats.put("mediumRisk",      mediumRisk);
        stats.put("lowRisk",         lowRisk);
        data.put("stats", stats);

        // ── Rate Limit ──
        if (!isSuperAdmin && tenantId != null) {
            tenantRepo.findById(tenantId).ifPresent(tenant -> {
                Map<String, Object> rateLimit = new HashMap<>();
                rateLimit.put("plan",         tenant.getPlan() != null ? tenant.getPlan().name() : "BASIC");
                rateLimit.put("dailyLimit",   tenant.getDailyLimit());
                rateLimit.put("usedToday",    tenant.getRequestsToday());
                rateLimit.put("remaining",    Math.max(0, tenant.getDailyLimit() - tenant.getRequestsToday()));
                rateLimit.put("resetAt",      LocalDate.now().plusDays(1) + "T00:00:00");
                rateLimit.put("usagePercent", tenant.getDailyLimit() > 0
                    ? Math.round((double) tenant.getRequestsToday() / tenant.getDailyLimit() * 100) : 0);
                data.put("rateLimit", rateLimit);
            });
        }

        // ── Recent Activity ──
        List<ScreeningResult> recent;
        if (isSuperAdmin) {
            recent = resultRepo.findTop10WithDetailsOrderByCreatedAtDesc(PageRequest.of(0, 10));
        } else if (isCompanyAdmin && tenantId != null) {
            recent = resultRepo.findTop10ByTenantIdOrderByCreatedAtDesc(tenantId, PageRequest.of(0, 10));
        } else {
            recent = resultRepo.findTop5ByRequest_CreatedBy_UsernameOrderByCreatedAtDesc(username);
        }

        data.put("recentActivity", recent.stream().map(r -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id",        r.getId());
            m.put("name",      r.getRequest() != null ? r.getRequest().getFullName() : "Unknown");
            m.put("time",      r.getCreatedAt() != null ? r.getCreatedAt().toString() : "");
            m.put("risk",      r.getRiskLevel() != null ? r.getRiskLevel().name() : "LOW");
            m.put("source",    r.getMatches() != null && !r.getMatches().isEmpty() ? r.getMatches().get(0).getSource() : "—");
            m.put("createdBy", r.getRequest() != null && r.getRequest().getCreatedBy() != null
                ? r.getRequest().getCreatedBy().getUsername() : "—");
            return m;
        }).collect(Collectors.toList()));

        // ──  Monthly Data — بيانات حقيقية من الـ DB ──
        data.put("monthlyData", buildMonthlyData(isSuperAdmin, isCompanyAdmin, tenantId, username, sixMonthsAgo));

        // ──  Top Countries — بيانات حقيقية من الـ matches ──
        data.put("topCountries", buildTopCountries(isSuperAdmin, isCompanyAdmin, tenantId, sixMonthsAgo));

        return data;
    }

    // ── Monthly Data Builder ──────────────────────────────────────────────────
    private List<Map<String, Object>> buildMonthlyData(boolean isSuperAdmin, boolean isCompanyAdmin,
                                                        Long tenantId, String username,
                                                        LocalDateTime from) {
        List<Object[]> searchRows;
        List<Object[]> matchRows;

        if (isSuperAdmin) {
            searchRows = requestRepo.countMonthlySearches(from);
            matchRows  = resultRepo.countMonthlyMatches(from);
        } else if (isCompanyAdmin && tenantId != null) {
            searchRows = requestRepo.countMonthlySearchesByTenant(from, tenantId);
            matchRows  = resultRepo.countMonthlyMatchesByTenant(from, tenantId);
        } else {
            searchRows = requestRepo.countMonthlySearchesByUser(from, username);
            matchRows  = resultRepo.countMonthlyMatchesByUser(from, username);
        }

        // حوّل الـ matches لـ map سريع
        Map<String, Long> matchMap = matchRows.stream()
            .collect(Collectors.toMap(
                r -> (String) r[0],
                r -> ((Number) r[2]).longValue()
            ));

        return searchRows.stream().map(r -> {
            String month    = (String) r[0];
            long   searches = ((Number) r[2]).longValue();
            long   matches  = matchMap.getOrDefault(month, 0L);
            Map<String, Object> m = new HashMap<>();
            m.put("month",    month.trim());
            m.put("searches", searches);
            m.put("matches",  matches);
            return m;
        }).collect(Collectors.toList());
    }

    // ── Top Sources Builder ──────────────────────────────────────────────────
    private List<Map<String, Object>> buildTopCountries(boolean isSuperAdmin, boolean isCompanyAdmin,
                                                         Long tenantId, LocalDateTime from) {
        List<Object[]> rows;

        if (isSuperAdmin || !isCompanyAdmin) {
            rows = resultRepo.findTopCountries(from);
        } else {
            rows = tenantId != null ? resultRepo.findTopCountriesByTenant(from, tenantId)
                                    : resultRepo.findTopCountries(from);
        }

        // أيقونات المصادر
        Map<String, String> icons = Map.of(
            "OFAC",  "🇺🇸",
            "EU",    "🇪🇺",
            "UN",    "🌐",
            "UK",    "🇬🇧",
            "LOCAL", "📋",
            "PEP",   "👤"
        );

        return rows.stream().map(r -> {
            String source = (String) r[0];
            long   count  = ((Number) r[1]).longValue();
            Map<String, Object> m = new HashMap<>();
            m.put("country", source);
            m.put("count",   count);
            m.put("flag",    icons.getOrDefault(source, "🔍"));
            return m;
        }).collect(Collectors.toList());
    }
}