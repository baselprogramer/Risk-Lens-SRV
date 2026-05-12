package com.sdn.blacklist.cases.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sdn.blacklist.cases.dto.CaseRequest;
import com.sdn.blacklist.cases.dto.CaseResponse;
import com.sdn.blacklist.cases.dto.CaseStatsResponse;
import com.sdn.blacklist.cases.service.CaseService;
import com.sdn.blacklist.config.ApiVersion;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(ApiVersion.V1 + "/cases")
@RequiredArgsConstructor
@Tag(name = "Cases", description = "إدارة الحالات والقرارات")
public class CaseController {

    private final CaseService service;

   
    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a ->
            a.getAuthority().equals("ROLE_SUPER_ADMIN") ||
            a.getAuthority().equals("ROLE_COMPANY_ADMIN"));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN','SUBSCRIBER')")
    public ResponseEntity<CaseResponse> create(@RequestBody CaseRequest req, Authentication auth) {
        return ResponseEntity.ok(service.createCase(req, auth.getName()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN','SUBSCRIBER')")
    public ResponseEntity<Page<CaseResponse>> getAll(
            Authentication auth,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        if (isAdmin(auth)) {
            return ResponseEntity.ok(service.getAll(page, size));
        }
        return ResponseEntity.ok(service.getByCreator(auth.getName(), page, size));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN','SUBSCRIBER')")
    public ResponseEntity<Page<CaseResponse>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(service.search(q, page, size));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN')")
    public ResponseEntity<Page<CaseResponse>> getByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(service.getByStatus(status, page, size));
    }

    @GetMapping("/my-cases")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN','SUBSCRIBER')")
    public ResponseEntity<Page<CaseResponse>> getMyCases(
            Authentication auth,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(service.getByAssignee(auth.getName(), page, size));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN','SUBSCRIBER')")
    public ResponseEntity<CaseResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN')")
    public ResponseEntity<CaseResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody StatusUpdateRequest req,
            Authentication auth) {
        return ResponseEntity.ok(service.updateStatus(id, req.getStatus(), req.getResolution(), auth.getName()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN','SUBSCRIBER')")
    public ResponseEntity<CaseResponse> update(
            @PathVariable Long id,
            @RequestBody CaseRequest req,
            Authentication auth) {
        if (!isAdmin(auth)) {
            CaseRequest notesOnly = new CaseRequest();
            notesOnly.setNotes(req.getNotes());
            return ResponseEntity.ok(service.updateCase(id, notesOnly, auth.getName()));
        }
        return ResponseEntity.ok(service.updateCase(id, req, auth.getName()));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN','SUBSCRIBER')")
    public ResponseEntity<CaseStatsResponse> getStats(Authentication auth) {
        if (isAdmin(auth)) {
            return ResponseEntity.ok(service.getStats());
        }
        return ResponseEntity.ok(service.getStatsByCreator(auth.getName()));
    }

    public record StatusUpdateRequest(String status, String resolution) {
        public String getStatus()     { return status;     }
        public String getResolution() { return resolution; }
    }
}