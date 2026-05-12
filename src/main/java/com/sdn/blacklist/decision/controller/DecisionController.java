package com.sdn.blacklist.decision.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sdn.blacklist.config.ApiVersion;
import com.sdn.blacklist.decision.dto.DecisionRequest;
import com.sdn.blacklist.decision.dto.DecisionResponse;
import com.sdn.blacklist.decision.service.DecisionService;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(ApiVersion.V1 + "/decisions")
@RequiredArgsConstructor
@Tag(name = "Decisions", description = "إدارة القرارات وسجل التدقيق")
public class DecisionController {

    private final DecisionService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN')")
    public ResponseEntity<DecisionResponse> create(@RequestBody DecisionRequest req, Authentication auth) {
        return ResponseEntity.ok(service.createDecision(req, auth.getName()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN')")
    public ResponseEntity<DecisionResponse> update(
            @PathVariable Long id, @RequestBody DecisionRequest req, Authentication auth) {
        return ResponseEntity.ok(service.updateDecision(id, req, auth.getName()));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN')")
    public ResponseEntity<List<DecisionResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{type}/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN','SUBSCRIBER')")
    public ResponseEntity<DecisionResponse> getLatest(@PathVariable String type, @PathVariable Long id) {
        DecisionResponse res = service.getLatestDecision(type, id);
        return res != null ? ResponseEntity.ok(res) : ResponseEntity.notFound().build();
    }

    @GetMapping("/{type}/{id}/audit")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN','SUBSCRIBER')")
    public ResponseEntity<List<DecisionResponse>> getAudit(@PathVariable String type, @PathVariable Long id) {
        return ResponseEntity.ok(service.getAuditTrail(type, id));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN','SUBSCRIBER')")
    public ResponseEntity<DecisionService.DecisionStatsResponse> getStats() {
        return ResponseEntity.ok(service.getStats());
    }
}