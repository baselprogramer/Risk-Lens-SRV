package com.sdn.blacklist.branch.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(
    name = "branches",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_branches_tenant_code",
        columnNames = {"tenant_id", "code"}
    )
)
@Getter
@Setter
public class Branch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    //  اسم الفرع — إلزامي
    @Column(nullable = false)
    private String name;

    //  كود/رمز داخلي للفرع (اختياري) — فريد داخل نفس البنك
    //  لازم ينخزّن NULL إذا فاضي (مش "") عشان الـ UNIQUE يشتغل صح
    @Column(name = "code")
    private String code;

    //  الشركة / البنك التابع له الفرع — نفس نمط باقي الـ entities (Long مش @ManyToOne)
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    //  id للـ user اللي أنشأ الفرع (مدير البنك عادةً) — للتتبّع
    @Column(name = "created_by")
    private Long createdBy;

    //  حالة الفرع — نعطّل بدل ما نحذف، عشان ما تضيع الحالات المرتبطة فيه
    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}