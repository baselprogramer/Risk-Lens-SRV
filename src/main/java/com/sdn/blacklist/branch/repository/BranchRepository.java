package com.sdn.blacklist.branch.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sdn.blacklist.branch.entity.Branch;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {

    //  كل فروع شركة معيّنة — الأساس للعزل، الـ tenantId بيجي من TenantContext بالـ service
    List<Branch> findByTenantId(Long tenantId);

    //  الفروع الفعّالة بس (للقوائم المنسدلة عند التعيين)
    List<Branch> findByTenantIdAndActiveTrue(Long tenantId);

    //  فرع محدد داخل شركة محددة — للتأكد إنو الفرع فعلاً تبع نفس البنك قبل أي عملية
    //  بيمنع إنو مدير بنك يوصل لفرع بنك تاني عبر id مخمّن
    Optional<Branch> findByIdAndTenantId(Long id, Long tenantId);

    //  للتحقق من تكرار الكود قبل الحفظ (نتجنّب الاصطدام بالـ UNIQUE constraint)
    Optional<Branch> findByTenantIdAndCode(Long tenantId, String code);
}