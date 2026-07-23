package com.sdn.blacklist.user.appointment;

import java.util.List;
import java.util.Set;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sdn.blacklist.config.ApiVersion;
import com.sdn.blacklist.user.entity.User;
import com.sdn.blacklist.user.entity.UserRole;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(ApiVersion.V1 + "/appointments")
//  الوصول مسموح لكل الأدوار اللي بتعيّن — القاعدة الفعلية (مين بيعيّن مين) بتنفرض جوّا بـ AppointmentRules
@PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'COMPLIANCE_MANAGER', 'BRANCH_MANAGER')")
@RequiredArgsConstructor
@Tag(name = "Appointments", description = "تعيين الموظفين حسب الشجرة التنظيمية")
public class AppointmentController {

    private final AppointmentService service;

    // ── تعيين موظف جديد ──
    @PostMapping
    public ResponseEntity<?> appoint(@RequestBody AppointRequest req,
                                     @AuthenticationPrincipal User currentUser) {
        try {
            UserRole targetRole = UserRole.valueOf(req.role().toUpperCase());
            User created = service.appoint(
                currentUser, req.username(), req.password(), targetRole, req.branchId()
            );
            return ResponseEntity.ok(new AppointResponse(
                created.getId(), created.getUsername(),
                created.getRole().name(), created.getBranchId()
            ));
        } catch (IllegalArgumentException e) {
            //  رول غير معروف (valueOf فشل)
            return ResponseEntity.badRequest().body("Invalid role: " + req.role());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── الأدوار اللي بيقدر المستخدم الحالي يعيّنها — لتعبئة القوائم بالواجهة ──
    @GetMapping("/appointable-roles")
    public ResponseEntity<List<String>> appointableRoles(@AuthenticationPrincipal User currentUser) {
        Set<UserRole> roles = AppointmentRules.appointableBy(currentUser.getRole());
        return ResponseEntity.ok(roles.stream().map(UserRole::name).toList());
    }

    // ── Records ──
    public record AppointRequest(
        String username,
        String password,
        String role,
        Long branchId   //  اختياري: إلزامي بس لما المعيّن على مستوى الشركة (مدير التزام)
    ) {}

    public record AppointResponse(
        Long id,
        String username,
        String role,
        Long branchId
    ) {}
}