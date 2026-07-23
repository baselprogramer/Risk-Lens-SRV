package com.sdn.blacklist.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import com.sdn.blacklist.branch.entity.Branch;
import com.sdn.blacklist.branch.service.BranchService;
import com.sdn.blacklist.config.ApiVersion;
import com.sdn.blacklist.security.JwtService;
import com.sdn.blacklist.user.appointment.AppointmentRules;
import com.sdn.blacklist.user.entity.User;
import com.sdn.blacklist.user.entity.UserRole;
import com.sdn.blacklist.user.repository.UserRepository;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(ApiVersion.V1 + "/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "تسجيل الدخول وإنشاء المستخدمين")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BranchService branchService;   // ← جديد: للتحقّق من الفرع

    // ── LOGIN — ما تغيّر ──
    @PostMapping("/authenticate")
    public ResponseEntity<?> authenticate(@RequestBody AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(), request.getPassword()));

        User user = (User) authentication.getPrincipal();
        String token = jwtService.generateToken(user);

        return ResponseEntity.ok(new AuthResponse(
                token,
                user.getUsername(),
                user.getRole().name(),
                user.getTenantId()));
    }

    // ── REGISTER — يفرض التسلسل + العزل + الفرع + الشجرة ──
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request,
                                      @AuthenticationPrincipal User currentUser) {

        // 0) المستخدم الحالي لازم يكون موجود (مصادَق)
        if (currentUser == null) {
            return ResponseEntity.status(401).body("Authentication required");
        }

        // 1) اسم فريد
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists");
        }

        // 2) الدور المطلوب صالح
        UserRole targetRole;
        try {
            targetRole = UserRole.valueOf(request.getRole().toUpperCase());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid role: " + request.getRole());
        }

        UserRole creatorRole = currentUser.getRole();

        // ══════════════════════════════════════════
        // 3) فرض الصلاحية — مين ينشئ مين
        // ══════════════════════════════════════════
        Long   effectiveTenantId;
        Long   effectiveBranchId = null;

        if (creatorRole == UserRole.SUPER_ADMIN) {
            // استثناء صريح: SUPER_ADMIN ينشئ COMPANY_ADMIN فقط (لشركات مختلفة)
            if (targetRole != UserRole.COMPANY_ADMIN) {
                return ResponseEntity.status(403)
                    .body("SUPER_ADMIN can only create COMPANY_ADMIN");
            }
            // الـ tenant بيجي من الطلب (SUPER بينشئ لشركات مختلفة)
            if (request.getTenantId() == null) {
                return ResponseEntity.badRequest()
                    .body("tenantId is required when creating a COMPANY_ADMIN");
            }
            effectiveTenantId = request.getTenantId();
            // COMPANY_ADMIN مش مربوط بفرع
        } else {
            // باقي الأدوار: لازم canAppoint يسمح، والـ tenant من المنشئ (مش من الطلب)
            if (!AppointmentRules.canAppoint(creatorRole, targetRole)) {
                return ResponseEntity.status(403)
                    .body(creatorRole + " cannot create " + targetRole);
            }

            // 🔒 العزل: الـ tenant دايماً من المنشئ، نتجاهل أي tenantId بالطلب
            effectiveTenantId = currentUser.getTenantId();
            if (effectiveTenantId == null) {
                return ResponseEntity.badRequest()
                    .body("Creator has no tenant — cannot create users");
            }

            // الفرع: إلزامي للأدوار المربوطة بفرع، ممنوع لغيرها
            if (AppointmentRules.isBranchScoped(targetRole)) {
                if (request.getBranchId() == null) {
                    return ResponseEntity.badRequest()
                        .body(targetRole + " requires a branchId");
                }
                // بوابة أمان: الفرع لازم يكون تبع نفس شركة المنشئ
                Branch branch = branchService.getBranch(request.getBranchId());
                effectiveBranchId = branch.getId();
            }
            // الأدوار غير المربوطة بفرع (COMPLIANCE_MANAGER) → branchId يضل null
        }

        // ══════════════════════════════════════════
        // 4) الإنشاء
        // ══════════════════════════════════════════
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(targetRole);
        user.setTenantId(effectiveTenantId);
        user.setBranchId(effectiveBranchId);
        user.setAppointedBy(currentUser.getId());   // ← يبني الشجرة

        userRepository.save(user);

        return ResponseEntity.ok("User created: " + request.getUsername() + " [" + targetRole + "]");
    }

    // ── الأدوار اللي المستخدم الحالي بيقدر ينشئها — للواجهة ──
    @GetMapping("/appointable-roles")
    public ResponseEntity<?> appointableRoles(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body("Authentication required");
        }
        // SUPER_ADMIN استثناء: ينشئ COMPANY_ADMIN
        if (currentUser.getRole() == UserRole.SUPER_ADMIN) {
            return ResponseEntity.ok(List.of(UserRole.COMPANY_ADMIN.name()));
        }
        List<String> roles = AppointmentRules.appointableBy(currentUser.getRole())
            .stream().map(UserRole::name).sorted().toList();
        return ResponseEntity.ok(roles);
    }
}