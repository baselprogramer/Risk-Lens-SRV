package com.sdn.blacklist.user.appointment;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sdn.blacklist.branch.entity.Branch;
import com.sdn.blacklist.branch.repository.BranchRepository;
import com.sdn.blacklist.tenant.context.TenantContext;
import com.sdn.blacklist.user.entity.User;
import com.sdn.blacklist.user.entity.UserRole;
import com.sdn.blacklist.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * منطق تعيين الموظفين — تعيين = إنشاء user جديد مربوط بالمعيّن (appointedBy) وبفرعه.
 * كل الحمايات بتنفرض هون: مين مسموح له يعيّن، تحديد الفرع، والتأكد إنو كل شي تبع نفس الشركة.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final UserRepository   userRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder  passwordEncoder;

    /**
     * تعيين موظف جديد.
     * @param appointer   الـ user اللي عم يعيّن (من SecurityContext)
     * @param username    اسم المستخدم للموظف الجديد
     * @param rawPassword الباسوورد الخام (بينشفّر هون)
     * @param targetRole  رول الموظف الجديد
     * @param branchId    الفرع — إلزامي إذا المعيّن على مستوى الشركة (زي مدير الالتزام)،
     *                    وبينتجاهل إذا المعيّن مربوط بفرع (الموظف بيرث فرع المعيّن)
     */
    @Transactional
    public User appoint(User appointer, String username, String rawPassword,
                        UserRole targetRole, Long branchId) {

        Long tenantId = requireTenant();

        // ① المعيّن لازم يكون من نفس الشركة (حماية إضافية — appointer جاي من التوكن)
        if (appointer.getTenantId() == null || !appointer.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Appointer tenant mismatch");
        }

        // ② هل المعيّن مسموح له يعيّن هالرول أصلاً؟
        if (!AppointmentRules.canAppoint(appointer.getRole(), targetRole)) {
            throw new RuntimeException(
                "Role " + appointer.getRole() + " cannot appoint " + targetRole);
        }

        // ③ username مش مكرّر
        if (userRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("Username already exists: " + username);
        }

        // ④ تحديد الفرع
        Long resolvedBranchId = resolveBranch(appointer, targetRole, branchId, tenantId);

        // ⑤ إنشاء الموظف
        User newUser = new User();
        newUser.setUsername(username);
        newUser.setPassword(passwordEncoder.encode(rawPassword));
        newUser.setRole(targetRole);
        newUser.setTenantId(tenantId);
        newUser.setAppointedBy(appointer.getId());
        newUser.setBranchId(resolvedBranchId);

        User saved = userRepository.save(newUser);
        log.info("✅ Appointed: {} ({}) by {} ({}) — branch:{} tenant:{}",
            saved.getUsername(), targetRole,
            appointer.getUsername(), appointer.getRole(),
            resolvedBranchId, tenantId);
        return saved;
    }

    // ══════════════════════════════════════════
    // تحديد الفرع — القاعدة اللي حسمناها بالـ AppointmentRules
    // ══════════════════════════════════════════

    /**
     * إذا المعيّن مربوط بفرع (مدير فرع) → الموظف الجديد بيرث فرعه، والـ branchId المُمرّر بينتجاهل.
     * إذا المعيّن على مستوى الشركة (مدير التزام) → لازم يختار فرع للموظف الـ branch-scoped.
     * إذا الرول الجديد أصلاً مش مربوط بفرع (مدير التزام، مدير فرع) → بلا فرع.
     */
    private Long resolveBranch(User appointer, UserRole targetRole,
                               Long requestedBranchId, Long tenantId) {

        // الرول الجديد مش مربوط بفرع → بلا فرع، بغض النظر عن أي شي
        if (!AppointmentRules.isBranchScoped(targetRole)) {
            return null;
        }

        // المعيّن مربوط بفرع → الموظف يرث فرعه (ما بيختار)
        if (AppointmentRules.isBranchScoped(appointer.getRole())) {
            if (appointer.getBranchId() == null) {
                throw new RuntimeException("Appointer has no branch assigned");
            }
            return appointer.getBranchId();
        }

        // المعيّن على مستوى الشركة → لازم يمرّر فرع صالح تبع نفس الشركة
        if (requestedBranchId == null) {
            throw new RuntimeException("Branch is required for role " + targetRole);
        }
        Branch branch = branchRepository.findByIdAndTenantId(requestedBranchId, tenantId)
            .orElseThrow(() -> new RuntimeException("Branch not found: " + requestedBranchId));
        if (!branch.isActive()) {
            throw new RuntimeException("Cannot appoint to a disabled branch");
        }
        return branch.getId();
    }

    // ── SUPER_ADMIN (context = null) ما بيعيّن موظفين داخل شركة ──
    private Long requireTenant() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new RuntimeException("No tenant in context — cannot appoint");
        }
        return tenantId;
    }
}