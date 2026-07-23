package com.sdn.blacklist.branch.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sdn.blacklist.branch.entity.Branch;
import com.sdn.blacklist.branch.repository.BranchRepository;
import com.sdn.blacklist.tenant.context.TenantContext;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class BranchService {

    private final BranchRepository repository;

    // ── جلب ──
    public List<Branch> getMyBranches() {
        Long tenantId = requireTenant();
        return repository.findByTenantId(tenantId);
    }

    public List<Branch> getMyActiveBranches() {
        Long tenantId = requireTenant();
        return repository.findByTenantIdAndActiveTrue(tenantId);
    }

    //  فرع محدد بشرط يكون تبع نفس الشركة — بيمنع الوصول لفرع بنك تاني عبر id مخمّن
    public Branch getBranch(Long branchId) {
        Long tenantId = requireTenant();
        return repository.findByIdAndTenantId(branchId, tenantId)
            .orElseThrow(() -> new RuntimeException("Branch not found: " + branchId));
    }

    // ── إنشاء فرع جديد ──
    @Transactional
    public Branch createBranch(String name, String code, Long createdBy) {
        Long tenantId = requireTenant();

        String normalizedCode = normalizeCode(code);
        assertCodeAvailable(tenantId, normalizedCode);

        Branch branch = new Branch();
        branch.setName(name);
        branch.setCode(normalizedCode);
        branch.setTenantId(tenantId);
        branch.setCreatedBy(createdBy);
        branch.setActive(true);

        Branch saved = repository.save(branch);
        log.info("✅ Branch created: {} (code:{}) — tenant:{}",
            saved.getName(), saved.getCode(), tenantId);
        return saved;
    }

    // ── تحديث ──
    @Transactional
    public Branch updateBranch(Long branchId, String name, String code) {
        Branch branch = getBranch(branchId);   // بيتأكد أصلاً إنو تبع نفس الشركة
        Long tenantId = branch.getTenantId();

        String normalizedCode = normalizeCode(code);

        if (normalizedCode != null && !normalizedCode.equals(branch.getCode())) {
            assertCodeAvailable(tenantId, normalizedCode);
        }

        if (name != null) branch.setName(name);
        branch.setCode(normalizedCode);

        Branch saved = repository.save(branch);
        log.info("✅ Branch updated: {} (code:{}) — tenant:{}",
            saved.getName(), saved.getCode(), tenantId);
        return saved;
    }

    // ── تعطيل (مش حذف) — عشان ما تضيع الحالات والموظفين المرتبطين ──
    @Transactional
    public Branch deactivateBranch(Long branchId) {
        Branch branch = getBranch(branchId);
        branch.setActive(false);
        Branch saved = repository.save(branch);
        log.info("✅ Branch deactivated: {} — tenant:{}",
            saved.getName(), saved.getTenantId());
        return saved;
    }

    // ── Helpers ──

    //  SUPER_ADMIN (context = null) ما إلو فروع
    private Long requireTenant() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new RuntimeException("No tenant in context — cannot manage branches");
        }
        return tenantId;
    }

    //  الكود الفاضي بينخزّن NULL (مش "") عشان الـ UNIQUE constraint يشتغل صح
    private String normalizeCode(String code) {
        if (code == null) return null;
        String trimmed = code.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    //  يمنع تكرار الكود داخل نفس الشركة قبل الاصطدام بالـ DB
    private void assertCodeAvailable(Long tenantId, String code) {
        if (code == null) return;   // الأكواد الفاضية مسموح تتكرّر (كلها NULL)
        repository.findByTenantIdAndCode(tenantId, code).ifPresent(existing -> {
            throw new RuntimeException("Branch code already exists: " + code);
        });
    }
}