package com.sdn.blacklist.blockpolicy.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

/**
 * قاعدة حظر ضمن سياسة البنك — كل بنك (tenant) بيحدد قواعدو لحالو.
 * لما نتيجة فحص تطابق قاعدة فعّالة، بتتأشّر الحالة كـ blocked مع رسالة القاعدة.
 */
@Entity
@Table(
    name = "block_policy_rules",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_block_rules_tenant_type_value",
        columnNames = {"tenant_id", "type", "value"}
    )
)
@Getter
@Setter
public class BlockPolicyRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    //  نوع القاعدة — دولة / جنسية / كيان محلي / كيان عالمي
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BlockRuleType type;

    //  القيمة اللي بتنمنع — كود دولة، اسم جنسية، أو اسم كيان
    @Column(nullable = false)
    private String value;

    //  رسالة التنبيه اللي بيشوفها الكونتوار — مدير البنك بيكتبها لكل قاعدة
    @Column(nullable = false, columnDefinition = "text")
    private String message;

    //  الشركة / البنك صاحب القاعدة — نفس نمط العزل بباقي الـ entities
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    //  تفعيل/تعطيل بدل الحذف — عشان نحافظ على المرجع من الحالات القديمة المبلوكة
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    //  id لمدير البنك اللي أنشأ القاعدة — للتتبّع
    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}