package com.sdn.blacklist.blockpolicy.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sdn.blacklist.blockpolicy.entity.BlockPolicyRule;
import com.sdn.blacklist.blockpolicy.entity.BlockRuleType;

@Repository
public interface BlockPolicyRepository extends JpaRepository<BlockPolicyRule, Long> {

    //  كل قواعد الشركة (للإدارة — مدير البنك يشوف كل قواعدو فعّالة ومعطّلة)
    List<BlockPolicyRule> findByTenantId(Long tenantId);

    //  الفعّالة بس — الأساس اللي محرّك الفحص بيستعملو
    List<BlockPolicyRule> findByTenantIdAndActiveTrue(Long tenantId);

    //  lookup الفحص: قواعد الشركة الفعّالة من نوع معيّن — بيستفيد من الفهرس المركّب
    List<BlockPolicyRule> findByTenantIdAndTypeAndActiveTrue(Long tenantId, BlockRuleType type);

    //  قاعدة محددة بشرط نفس الشركة — بوابة أمان، بيمنع الوصول لقاعدة بنك تاني عبر id مخمّن
    Optional<BlockPolicyRule> findByIdAndTenantId(Long id, Long tenantId);

    //  للتحقق من التكرار قبل الحفظ (نتجنّب الاصطدام بالـ UNIQUE constraint)
    Optional<BlockPolicyRule> findByTenantIdAndTypeAndValue(Long tenantId, BlockRuleType type, String value);
}