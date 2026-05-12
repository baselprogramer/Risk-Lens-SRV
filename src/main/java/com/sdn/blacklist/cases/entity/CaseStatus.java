package com.sdn.blacklist.cases.entity;

public enum CaseStatus {
    OPEN,        // فتح تلقائياً عند وجود match
    IN_REVIEW,   // قيد المراجعة
    ESCALATED,   // مرفوع لمستوى أعلى
    CLOSED       // مغلق بقرار نهائي
}