package com.sdn.blacklist.cases.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "cases")
@Data
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Case {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CaseType caseType;

    @Column(nullable = false)
    private Long screeningId;

    @Column(nullable = false)
    private String subjectName;

    private String reference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CaseStatus status;

    @Enumerated(EnumType.STRING)
    private CasePriority priority;

    private String assignedTo;
    private String createdBy;

    @Column(columnDefinition = "text")
    private String notes;

    @Column(columnDefinition = "text")
    private String resolution;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
    private LocalDateTime closedAt;
    private LocalDateTime dueDate;

    private String riskLevel;
    private Integer matchCount;

    @Column(name = "tenant_id")
    private Long tenantId;

    @Column(name = "branch_id")
    private Long branchId; 

    // ══════════════════════════════════════════
    //  حظر سياسة البنك — الحالة مخالفة لسياسة داخلية (دولة/جنسية ممنوعة)
    //  مستقل عن القوائم والعقوبات
    // ══════════════════════════════════════════

    //  هل الحالة مبلوكة بسياسة البنك؟
    @Column(name = "blocked", nullable = false)
    private boolean blocked = false;

    //  رسالة التنبيه اللي بيشوفها الكونتوار
    @Column(name = "block_message", columnDefinition = "text")
    private String blockMessage;

    //  id القاعدة اللي سبّبت الحظر — للتتبّع
    @Column(name = "block_rule_id")
    private Long blockRuleId;
}