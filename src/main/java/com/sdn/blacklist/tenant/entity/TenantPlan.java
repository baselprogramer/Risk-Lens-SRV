package com.sdn.blacklist.tenant.entity;

public enum TenantPlan {

    BASIC(500),         // 500  طلب/يوم
    PRO(5_000),         // 5000 طلب/يوم
    ENTERPRISE(100_000); // غير محدود عملياً

    private final int dailyLimit;

    TenantPlan(int dailyLimit) {
        this.dailyLimit = dailyLimit;
    }

    public int getDailyLimit() {
        return dailyLimit;
    }
}