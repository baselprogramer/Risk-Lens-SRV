package com.sdn.blacklist.decision.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sdn.blacklist.decision.entity.Decision;
import com.sdn.blacklist.decision.entity.Decision.DecisionType;
import com.sdn.blacklist.decision.entity.Decision.ScreeningType;

@Repository
public interface DecisionRepository extends JpaRepository<Decision, Long> {

    // كل القرارات مرتبة حسب التاريخ
    List<Decision> findAllByOrderByDecidedAtDesc();

    // آخر قرار على نتيجة معينة
    Optional<Decision> findTopByScreeningTypeAndScreeningIdOrderByDecidedAtDesc(
        ScreeningType type, Long screeningId);

    // كل قرارات نتيجة معينة — Audit Trail
    List<Decision> findByScreeningTypeAndScreeningIdOrderByDecidedAtDesc(
        ScreeningType type, Long screeningId);

    // إحصائيات
    long countByDecision(DecisionType decision);
    long countByDecidedBy(String username);

    List<Decision> findByTenantIdOrderByDecidedAtDesc(Long tenantId);
 
    long countByTenantId(Long tenantId);
    
    long countByDecisionAndTenantId(Decision.DecisionType decision, Long tenantId);
 
}