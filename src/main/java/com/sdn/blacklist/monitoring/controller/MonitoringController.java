package com.sdn.blacklist.monitoring.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sdn.blacklist.monitoring.entity.MonitoringAlert;
import com.sdn.blacklist.monitoring.service.MonitoringService;
import com.sdn.blacklist.tenant.context.TenantContext;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/monitoring")
@RequiredArgsConstructor
@Tag(name = "Monitoring", description = "مراقبة صحة النظام والتنبيهات")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','COMPANY_ADMIN')")
public class MonitoringController {

    private final MonitoringService monitoringService;

    @GetMapping("/alerts")
    public ResponseEntity<List<MonitoringAlert>> getActive() {
        return ResponseEntity.ok(monitoringService.getActive());
    }

    @GetMapping("/alerts/all")
    public ResponseEntity<List<MonitoringAlert>> getAll() {
        return ResponseEntity.ok(monitoringService.getAll());
    }

   @GetMapping("/alerts/my")
    public ResponseEntity<List<MonitoringAlert>> getMyAlerts(
            @RequestParam(defaultValue = "false") boolean all) {
        Long tenantId = TenantContext.getTenantId();
        List<MonitoringAlert> alerts = all
            ? monitoringService.getAllAlertsByTenant(tenantId)
            : monitoringService.getAlertsByTenant(tenantId);
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/alerts/count")
    public ResponseEntity<Map<String, Long>> getCount() {
        return ResponseEntity.ok(Map.of(
            "active", monitoringService.getActiveCount()
        ));
    }

    @PutMapping("/alerts/{id}/resolve")
    public ResponseEntity<Void> resolve(@PathVariable Long id) {
        monitoringService.resolve(id);
        return ResponseEntity.ok().build();
    }
}