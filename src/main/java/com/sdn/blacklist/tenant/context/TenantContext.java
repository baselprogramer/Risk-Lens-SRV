package com.sdn.blacklist.tenant.context;

import com.sdn.blacklist.user.entity.UserRole;

/**
 * يحفظ سياق الـ tenant للـ thread الحالي.
 * كل request له سياقه الخاص (tenant + branch + user + role).
 *
 * ⚠️ ThreadLocal لا ينتقل للـ virtual threads —
 *    لازم التقاط القيم على thread الـ request قبل أي async dispatch.
 */
public class TenantContext {

    private static final ThreadLocal<Long>     CURRENT_TENANT = new ThreadLocal<>();
    private static final ThreadLocal<Long>     CURRENT_BRANCH = new ThreadLocal<>();
    private static final ThreadLocal<Long>     CURRENT_USER   = new ThreadLocal<>();
    private static final ThreadLocal<UserRole> CURRENT_ROLE   = new ThreadLocal<>();

    // ── Tenant ──
    public static void setTenantId(Long tenantId) { CURRENT_TENANT.set(tenantId); }
    public static Long getTenantId()              { return CURRENT_TENANT.get(); }

    // ── Branch ──
    public static void setBranchId(Long branchId) { CURRENT_BRANCH.set(branchId); }
    public static Long getBranchId()              { return CURRENT_BRANCH.get(); }

    // ── User ──
    public static void setUserId(Long userId)     { CURRENT_USER.set(userId); }
    public static Long getUserId()                { return CURRENT_USER.get(); }

    // ── Role ──
    public static void setRole(UserRole role)     { CURRENT_ROLE.set(role); }
    public static UserRole getRole()              { return CURRENT_ROLE.get(); }

    // ── Clear (كل الحقول) ──
    public static void clear() {
        CURRENT_TENANT.remove();
        CURRENT_BRANCH.remove();
        CURRENT_USER.remove();
        CURRENT_ROLE.remove();
    }
}