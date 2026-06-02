package com.sdn.blacklist.screening.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sdn.blacklist.config.ApiVersion;
import com.sdn.blacklist.decision.dto.DecisionResponse;
import com.sdn.blacklist.decision.service.DecisionService;
import com.sdn.blacklist.screening.dto.ScreeningResultDto;
import com.sdn.blacklist.screening.model.ScreeningResult;
import com.sdn.blacklist.screening.repository.ScreeningRequestRepository;
import com.sdn.blacklist.screening.repository.ScreeningResultRepository;
import com.sdn.blacklist.screening.service.ScreeningService;
import com.sdn.blacklist.tenant.context.TenantContext;
import com.sdn.blacklist.user.entity.User;
import com.sdn.blacklist.user.repository.UserRepository;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@CrossOrigin(origins = {"https://risk-lens.net", "https://api.risk-lens.net"})
@RestController
@RequestMapping(ApiVersion.V1 + "/screening")
@Tag(name = "Screening", description = "فحص الأشخاص وعرض السجل")
public class ScreeningController {

    private final ScreeningService           screeningService;
    private final UserRepository             userRepository;
    private final DecisionService            decisionService;
    private final ScreeningResultRepository  screeningResultRepository;
    private final ScreeningRequestRepository screeningRequestRepository;

    public ScreeningController(ScreeningService screeningService,
                               UserRepository userRepository,
                               DecisionService decisionService,
                               ScreeningResultRepository screeningResultRepository,
                               ScreeningRequestRepository screeningRequestRepository) {
        this.screeningService            = screeningService;
        this.userRepository              = userRepository;
        this.decisionService             = decisionService;
        this.screeningResultRepository   = screeningResultRepository;
        this.screeningRequestRepository  = screeningRequestRepository;
    }

    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a ->
            a.getAuthority().equals("ROLE_SUPER_ADMIN") ||
            a.getAuthority().equals("ROLE_COMPANY_ADMIN"));
    }

    // ══════════════════════════════════════════
    //  POST /screening/screen
    //
    //  يقبل:
    //  - fullName (مطلوب)
    //  - fullNameAr, nationality, dob, idType, idNumber, country (اختياري)
    //
    //  الـ confirming factors تُطبَّق تلقائياً
    //  إذا أُرسلت البيانات الإضافية
    // ══════════════════════════════════════════
    @PostMapping("/screen")
    public ScreeningResultDto createScreening(
            @RequestBody ScreeningRequestBody body,
            Authentication authentication) {

        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // parse dob إذا موجود
        LocalDate dob = null;
        if (body.dob() != null && !body.dob().isBlank()) {
            try { dob = LocalDate.parse(body.dob()); }
            catch (Exception e) { log.warn("Invalid dob format: {}", body.dob()); }
        }

        boolean hasKyc = body.nationality() != null
            || dob != null
            || body.idNumber() != null;

        ScreeningResult result;

        if (hasKyc) {
            // الـ method الجديد مع confirming factors
            result = screeningService.screenPersonFull(
                body.fullName(),
                body.fullNameAr(),
                body.nationality(),
                dob,
                body.idType(),
                body.idNumber(),
                body.country(),
                user
            );
            log.info("🔍 Full KYC screening: name='{}' nat={} dob={} idType={}",
                body.fullName(), body.nationality(), dob, body.idType());
        } else {
            // الـ method الأصلي — للتوافق مع الكود القديم
            result = screeningService.screenPerson(body.fullName(), user);
        }

        return new ScreeningResultDto(result);
    }

    // ── Request Body Record ──
    public record ScreeningRequestBody(
        String fullName,        // مطلوب
        String fullNameAr,      // اختياري — الاسم بالعربي
        String nationality,     // اختياري — SY, IQ, JO...
        String dob,             // اختياري — yyyy-MM-dd
        String idType,          // اختياري — NATIONAL_ID | PASSPORT | RESIDENCE
        String idNumber,        // اختياري — رقم الوثيقة
        String country          // اختياري — كود البلد
    ) {}

    // ── Get by ID ──
    @Transactional
    @GetMapping("/{id}")
    public ResponseEntity<ScreeningResultDto> getById(
            @PathVariable Long id,
            Authentication auth) {
        return screeningResultRepository.findById(id)
            .map(r -> ResponseEntity.ok(new ScreeningResultDto(r)))
            .orElse(ResponseEntity.notFound().build());
    }

    // ── My History ──
    @GetMapping("/my-history")
    public ResponseEntity<List<MyHistoryDTO>> getMyHistory(Authentication auth) {
        String username  = auth.getName();
        boolean admin    = isAdmin(auth);
        Long    tenantId = TenantContext.getTenantId();

        List<ScreeningResult> results;

        if (tenantId == null) {
            results = screeningResultRepository.findTop50ByOrderByIdDesc();
        } else if (admin) {
            results = screeningResultRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        } else {
            results = screeningResultRepository
                .findTop20ByRequest_CreatedBy_UsernameOrderByCreatedAtDesc(username);
        }

        List<MyHistoryDTO> history = results.stream().map(r -> {
            LocalDateTime date = r.getCreatedAt() != null
                ? r.getCreatedAt()
                : (r.getRequest() != null ? r.getRequest().getCreatedAt() : null);

            String fullName = r.getRequest() != null
                ? r.getRequest().getFullName() : "—";

            String createdBy = (r.getRequest() != null && r.getRequest().getCreatedBy() != null)
                ? r.getRequest().getCreatedBy().getUsername() : "—";

            String riskLevel = r.getRiskLevel() != null
                ? r.getRiskLevel().name() : "UNKNOWN";

            DecisionResponse latestDecision =
                decisionService.getLatestDecision("PERSON", r.getId());

            return new MyHistoryDTO(r.getId(), fullName, createdBy, riskLevel, date, latestDecision);
        }).toList();

        return ResponseEntity.ok(history);
    }

    public record MyHistoryDTO(
        Long             id,
        String           fullName,
        String           createdBy,
        String           riskLevel,
        LocalDateTime    createdAt,
        DecisionResponse latestDecision
    ) {}
}