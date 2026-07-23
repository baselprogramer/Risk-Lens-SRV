package com.sdn.blacklist.blockpolicy.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sdn.blacklist.blockpolicy.entity.BlockPolicyRule;
import com.sdn.blacklist.blockpolicy.entity.BlockRuleType;
import com.sdn.blacklist.blockpolicy.service.BlockPolicyService;
import com.sdn.blacklist.config.ApiVersion;
import com.sdn.blacklist.user.entity.User;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;

@RestController
@RequestMapping(ApiVersion.V1 + "/block-policy")
@PreAuthorize("hasRole('COMPANY_ADMIN')")   // ← سياسة الحظر لمدير البنك فقط
@RequiredArgsConstructor
@Tag(name = "Block Policy", description = "سياسة حظر البنك — دول/جنسيات ممنوعة — COMPANY_ADMIN فقط")
public class BlockPolicyController {

    private final BlockPolicyService service;

    // ── كل قواعد الشركة ──
    @GetMapping
    public ResponseEntity<List<BlockPolicyRule>> getAll() {
        return ResponseEntity.ok(service.getMyRules());
    }

    // ── إنشاء قاعدة ──
    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateRuleRequest req,
                                    @AuthenticationPrincipal User currentUser) {
        try {
            BlockRuleType type = BlockRuleType.valueOf(req.type().toUpperCase());
            return ResponseEntity.ok(service.createRule(
                type, req.value(), req.message(), currentUser.getId()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid rule type: " + req.type());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── تحديث قاعدة (الرسالة أو التفعيل) ──
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody UpdateRuleRequest req) {
        try {
            return ResponseEntity.ok(service.updateRule(id, req.message(), req.active()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── تعطيل قاعدة ──
    @PutMapping("/{id}/deactivate")
    public ResponseEntity<BlockPolicyRule> deactivate(@PathVariable Long id) {
        return ResponseEntity.ok(service.deactivateRule(id));
    }

     // ── حذف قاعدة ──
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteRule(id);
        return ResponseEntity.noContent().build();
    }

    // ── Records ──
    public record CreateRuleRequest(String type, String value, String message) {}
    public record UpdateRuleRequest(String message, Boolean active) {}
}