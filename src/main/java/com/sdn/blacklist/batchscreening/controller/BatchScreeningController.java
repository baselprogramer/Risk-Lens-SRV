package com.sdn.blacklist.batchscreening.controller;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.sdn.blacklist.batchscreening.dto.BatchJobResponse;
import com.sdn.blacklist.batchscreening.entity.BatchScreeningJob;
import com.sdn.blacklist.batchscreening.export.BatchReportExporter;
import com.sdn.blacklist.batchscreening.service.BatchFileParser.BatchParseException;
import com.sdn.blacklist.batchscreening.service.BatchScreeningService;
import com.sdn.blacklist.config.ApiVersion;
import com.sdn.blacklist.tenant.context.TenantContext;
import com.sdn.blacklist.user.entity.User;

import io.swagger.v3.oas.annotations.tags.Tag;

@CrossOrigin(origins = { "https://risk-lens.net", "https://api.risk-lens.net" })
@RestController
@RequestMapping(ApiVersion.V1 + "/batch-screening")
@Tag(name = "Batch Screening", description = "الفحص الجماعي عبر رفع ملف أسماء")
public class BatchScreeningController {

    private final BatchScreeningService service;
    private final BatchReportExporter   exporter;

    public BatchScreeningController(BatchScreeningService service,
                                    BatchReportExporter   exporter) {
        this.service  = service;
        this.exporter = exporter;
    }

    // نفس نمط InternalListController — ممكن يرجّع null لـ SUPER_ADMIN (مقصود)
    private Long resolveTenantId(Authentication auth) {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null && auth != null && auth.getPrincipal() instanceof User user) {
            tenantId = user.getTenantId();
        }
        return tenantId;
    }

    private User currentUser(Authentication auth) {
        return (auth != null && auth.getPrincipal() instanceof User user) ? user : null;
    }

    // ── رفع الملف → يرجّع jobId فوراً (المعالجة بالخلفية) ──────────────
    @PostMapping
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file, Authentication auth) {
        if (file == null || file.isEmpty())
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("الملف فاضي أو غير مرفق");
        try {
            BatchScreeningJob job = service.startBatch(file, currentUser(auth));
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(BatchJobResponse.from(job));
        } catch (BatchParseException e) {
            // ملف غلط (بلا عمود اسم / فاضي) → 400 مع رسالة عربية واضحة
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("فشل بدء الفحص الجماعي: " + e.getMessage());
        }
    }

    // ── حالة + progress (للـ polling) ─────────────────────────────────
    @GetMapping("/{jobId}")
    public ResponseEntity<?> status(@PathVariable Long jobId, Authentication auth) {
        Long tenantId = resolveTenantId(auth);
        return service.getJob(jobId)
            .filter(j -> canAccess(j, tenantId))
            .<ResponseEntity<?>>map(j -> ResponseEntity.ok(BatchJobResponse.from(j)))
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Job غير موجود: " + jobId));
    }

    // ── نتائج الفحص (للجدول) ──────────────────────────────────────────
    @GetMapping("/{jobId}/results")
    public ResponseEntity<?> results(@PathVariable Long jobId, Authentication auth) {
        Long tenantId = resolveTenantId(auth);
        return service.getJob(jobId)
            .filter(j -> canAccess(j, tenantId))
            .<ResponseEntity<?>>map(j -> ResponseEntity.ok(service.getResults(jobId)))
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Job غير موجود: " + jobId));
    }

    // ── تنزيل تقرير Excel ─────────────────────────────────────────────
    @GetMapping("/{jobId}/report")
    public ResponseEntity<?> report(@PathVariable Long jobId, Authentication auth) {
        Long tenantId = resolveTenantId(auth);
        BatchScreeningJob job = service.getJob(jobId).filter(j -> canAccess(j, tenantId)).orElse(null);
        if (job == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Job غير موجود: " + jobId);
        try {
            byte[] xlsx = exporter.export(job, service.getResults(jobId));
            String name = "batch-report-" + jobId + ".xlsx";
            String encoded = URLEncoder.encode(name, StandardCharsets.UTF_8).replace("+", "%20");
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + name + "\"; filename*=UTF-8''" + encoded)
                .contentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(xlsx);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("فشل توليد التقرير: " + e.getMessage());
        }
    }

    // ── تاريخ الـ jobs تبع الشركة (أو الكل للسوبر أدمن) ────────────────
    @GetMapping
    public ResponseEntity<?> history(Authentication auth) {
        Long tenantId = resolveTenantId(auth);
        return ResponseEntity.ok(
            service.getHistory(tenantId).stream().map(BatchJobResponse::from).toList());
    }

    // عزل: الشركة تشوف jobs تبعها بس؛ السوبر أدمن (tenant=null) يشوف الكل
    private boolean canAccess(BatchScreeningJob job, Long tenantId) {
        if (tenantId == null) return true;                       // سوبر أدمن
        return tenantId.equals(job.getTenantId());               // نفس الشركة
    }
}