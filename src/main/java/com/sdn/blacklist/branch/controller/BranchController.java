package com.sdn.blacklist.branch.controller;

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

import com.sdn.blacklist.branch.entity.Branch;
import com.sdn.blacklist.branch.service.BranchService;
import com.sdn.blacklist.config.ApiVersion;
import com.sdn.blacklist.user.entity.User;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(ApiVersion.V1 + "/branches")
@PreAuthorize("hasRole('COMPANY_ADMIN')")   // ← إدارة الفروع لمدير الشركة فقط
@RequiredArgsConstructor
@Tag(name = "Branches", description = "إدارة الفروع — COMPANY_ADMIN فقط")
public class BranchController {

    private final BranchService service;

    // ── كل فروع الشركة ──
    @GetMapping
    public ResponseEntity<List<Branch>> getAll() {
        return ResponseEntity.ok(service.getMyBranches());
    }

    // ── الفروع الفعّالة بس (للقوائم المنسدلة) ──
    @GetMapping("/active")
    public ResponseEntity<List<Branch>> getActive() {
        return ResponseEntity.ok(service.getMyActiveBranches());
    }

    // ── فرع واحد ──
    @GetMapping("/{id}")
    public ResponseEntity<Branch> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getBranch(id));
    }

    // ── إنشاء فرع ──
    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateBranchRequest req,
                                    @AuthenticationPrincipal User currentUser) {
        try {
            return ResponseEntity.ok(service.createBranch(
                req.name(), req.code(), currentUser.getId()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── تحديث فرع ──
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody UpdateBranchRequest req) {
        try {
            return ResponseEntity.ok(service.updateBranch(id, req.name(), req.code()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── تعطيل فرع ──
    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Branch> deactivate(@PathVariable Long id) {
        return ResponseEntity.ok(service.deactivateBranch(id));
    }

    // ── Records ──
    public record CreateBranchRequest(String name, String code) {}
    public record UpdateBranchRequest(String name, String code) {}
}