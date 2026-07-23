package com.sdn.blacklist.blockpolicy.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sdn.blacklist.blockpolicy.entity.BlockPolicyRule;
import com.sdn.blacklist.blockpolicy.entity.BlockRuleType;
import com.sdn.blacklist.blockpolicy.repository.BlockPolicyRepository;
import com.sdn.blacklist.tenant.context.TenantContext;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * محرّك سياسة الحظر — جزئين:
 *  ① إدارة القواعد (مدير البنك) — CRUD معزول بالـ tenant.
 *  ② الفحص — بياخد دول وجنسيات ويرجّع هل في قاعدة حظر فعّالة بتنطبق.
 *  ملاحظة: الحظر مستقل عن القوائم — القوائم عقوبات، هاد سياسة داخلية للبنك على دول/جنسيات.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BlockPolicyService {

    private final BlockPolicyRepository repository;

    // ══════════════════════════════════════════
    // ① إدارة القواعد
    // ══════════════════════════════════════════

    public List<BlockPolicyRule> getMyRules() {
        Long tenantId = requireTenant();
        return repository.findByTenantId(tenantId);
    }

    @Transactional
    public BlockPolicyRule createRule(BlockRuleType type, String value, String message, Long createdBy) {
        Long tenantId = requireTenant();

        String normalizedValue = normalize(value);
        if (normalizedValue == null) {
            throw new RuntimeException("Rule value cannot be empty");
        }
        if (message == null || message.trim().isEmpty()) {
            throw new RuntimeException("Alert message is required");
        }

        //  نمنع التكرار قبل الاصطدام بالـ UNIQUE constraint
        repository.findByTenantIdAndTypeAndValue(tenantId, type, normalizedValue).ifPresent(existing -> {
            throw new RuntimeException("Rule already exists: " + type + " = " + normalizedValue);
        });

        BlockPolicyRule rule = new BlockPolicyRule();
        rule.setType(type);
        rule.setValue(normalizedValue);
        rule.setMessage(message.trim());
        rule.setTenantId(tenantId);
        rule.setActive(true);
        rule.setCreatedBy(createdBy);
        rule.setCreatedAt(LocalDateTime.now());

        BlockPolicyRule saved = repository.save(rule);
        log.info("✅ Block rule created: {} = {} — tenant:{}", type, normalizedValue, tenantId);
        return saved;
    }

    @Transactional
    public BlockPolicyRule updateRule(Long id, String message, Boolean active) {
        BlockPolicyRule rule = getRule(id);   // بيتأكد إنو تبع نفس الشركة

        if (message != null && !message.trim().isEmpty()) {
            rule.setMessage(message.trim());
        }
        if (active != null) {
            rule.setActive(active);
        }

        BlockPolicyRule saved = repository.save(rule);
        log.info("✅ Block rule updated: #{} — active:{} tenant:{}",
            saved.getId(), saved.isActive(), saved.getTenantId());
        return saved;
    }

    @Transactional
    public BlockPolicyRule deactivateRule(Long id) {
        BlockPolicyRule rule = getRule(id);
        rule.setActive(false);
        BlockPolicyRule saved = repository.save(rule);
        log.info("✅ Block rule deactivated: #{} — tenant:{}", saved.getId(), saved.getTenantId());
        return saved;
    }

    //  قاعدة محددة بشرط نفس الشركة — بوابة أمان
    public BlockPolicyRule getRule(Long id) {
        Long tenantId = requireTenant();
        return repository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new RuntimeException("Rule not found: " + id));
    }

    // ══════════════════════════════════════════
    // ② الفحص — بينستدعى من محرّك الـ screening/transfer
    // ══════════════════════════════════════════

    /**
     * نتيجة الفحص: هل مبلوك، وإذا آه شو الرسالة والقاعدة.
     * blocked=false معناها ما في قاعدة بتنطبق.
     */
    public record BlockCheckResult(boolean blocked, String message, Long ruleId) {
        public static BlockCheckResult clear() {
            return new BlockCheckResult(false, null, null);
        }
    }

    /**
     * يفحص مجموعة دول وجنسيات مقابل قواعد حظر البنك.
     * بالتحويل: نمرّر [دولة التحويل] + [جنسية المرسل، جنسية المستلم].
     * بالفحص المفرد: نمرّر [دولة الشخص] + [جنسية الشخص].
     * أول قاعدة بتنطبق بتوقف الفحص وترجّع الحظر.
     *
     * @param tenantId      شركة الفحص (بيجي من الـ caller لأنو ممكن يكون بسياق async)
     * @param countries     الدول للفحص (اختياري)
     * @param nationalities الجنسيات للفحص (اختياري)
     */
    public BlockCheckResult check(Long tenantId, List<String> countries, List<String> nationalities) {
        if (tenantId == null) {
            return BlockCheckResult.clear();   // بلا شركة → ما في سياسة حظر
        }

        if (countries != null) {
            for (String c : countries) {
                BlockCheckResult r = matchValue(tenantId, BlockRuleType.COUNTRY, c);
                if (r.blocked()) return r;
            }
        }

        if (nationalities != null) {
            for (String n : nationalities) {
                BlockCheckResult r = matchValue(tenantId, BlockRuleType.NATIONALITY, n);
                if (r.blocked()) return r;
            }
        }

        return BlockCheckResult.clear();
    }

    //  يقارن قيمة وحدة مقابل قواعد نوع معيّن للشركة — مقارنة غير حسّاسة لحالة الأحرف والمسافات
    private BlockCheckResult matchValue(Long tenantId, BlockRuleType type, String rawValue) {
        String value = normalize(rawValue);
        if (value == null) return BlockCheckResult.clear();

        List<BlockPolicyRule> rules = repository.findByTenantIdAndTypeAndActiveTrue(tenantId, type);
        for (BlockPolicyRule rule : rules) {
            if (value.equalsIgnoreCase(rule.getValue())) {
                return new BlockCheckResult(true, rule.getMessage(), rule.getId());
            }
        }
        return BlockCheckResult.clear();
    }


    public void deleteRule(Long id) {
        Long tenantId = requireTenant();   // أو TenantContext.getTenantId() متل باقي ميثوداتك
        BlockPolicyRule rule = repository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new RuntimeException("Block rule not found: " + id));
        repository.delete(rule);
        log.info("✅ Block rule deleted: {} — tenant:{}", id, tenantId);
    }
    // ══════════════════════════════════════════
    // helpers
    // ══════════════════════════════════════════

    private Long requireTenant() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new RuntimeException("No tenant in context — cannot manage block rules");
        }
        return tenantId;
    }

    private String normalize(String s) {
        if (s == null) return null;
        String trimmed = s.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}