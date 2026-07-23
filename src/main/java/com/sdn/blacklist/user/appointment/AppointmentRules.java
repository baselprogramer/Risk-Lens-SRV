package com.sdn.blacklist.user.appointment;

import java.util.Map;
import java.util.Set;

import com.sdn.blacklist.user.entity.UserRole;

/**
 * قواعد التعيين التنظيمية — مين بيقدر يعيّن مين، ومين مربوط بفرع.
 * منطق ثابت بالكود عن قصد: القواعد التنظيمية للبنك مستقرة، ومحروسة بمكان واحد.
 * لو احتجنا مرونة لاحقاً (قواعد قابلة للتعديل من الداتا بيس)، بننقلها من هون بس.
 */
public final class AppointmentRules {

    private AppointmentRules() {}   // utility class — ما في instances

    // ── مين بيعيّن مين: الرول → الرولات المسموح له يعيّنها ──
    private static final Map<UserRole, Set<UserRole>> CAN_APPOINT = Map.of(
        UserRole.COMPANY_ADMIN,      Set.of(UserRole.COMPLIANCE_MANAGER, UserRole.BRANCH_MANAGER),
        UserRole.COMPLIANCE_MANAGER, Set.of(UserRole.COMPLIANCE_OFFICER),
        UserRole.BRANCH_MANAGER,     Set.of(UserRole.TELLER)
        // COMPLIANCE_OFFICER, TELLER, SUPER_ADMIN, SUBSCRIBER → ما بيعيّنوا حدا
    );

    // ── الرولات المربوطة بفرع (لازم يكون عندها branchId) ──
    private static final Set<UserRole> BRANCH_SCOPED = Set.of(
        UserRole.BRANCH_MANAGER,
        UserRole.COMPLIANCE_OFFICER,
        UserRole.TELLER
        // COMPANY_ADMIN و COMPLIANCE_MANAGER → على مستوى الشركة كلها (بلا فرع)
    );

    /** هل الـ appointer مسموح له يعيّن هالـ target role؟ */
    public static boolean canAppoint(UserRole appointer, UserRole target) {
        return CAN_APPOINT.getOrDefault(appointer, Set.of()).contains(target);
    }

    /** الرولات اللي هالـ appointer بيقدر يعيّنها — مفيدة لتعبئة القوائم بالواجهة. */
    public static Set<UserRole> appointableBy(UserRole appointer) {
        return CAN_APPOINT.getOrDefault(appointer, Set.of());
    }

    /** هل هالرول لازم يكون مربوط بفرع؟ */
    public static boolean isBranchScoped(UserRole role) {
        return BRANCH_SCOPED.contains(role);
    }
}