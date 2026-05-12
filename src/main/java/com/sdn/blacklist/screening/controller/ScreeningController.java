package com.sdn.blacklist.screening.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
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

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping(ApiVersion.V1 + "/screening")
@Tag(name = "Screening", description = "فحص الأشخاص وعرض السجل")
public class ScreeningController {

    private final ScreeningService            screeningService;
    private final UserRepository              userRepository;
    private final DecisionService             decisionService;
    private final ScreeningResultRepository   screeningResultRepository;
    private final ScreeningRequestRepository  screeningRequestRepository;

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

    // ── Helper ──
    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a ->
            a.getAuthority().equals("ROLE_SUPER_ADMIN") ||
            a.getAuthority().equals("ROLE_COMPANY_ADMIN"));
    }

    @PostMapping("/screen")
    public ScreeningResultDto createScreening(
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        String fullName = body.get("fullName");
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ScreeningResult result = screeningService.screenPerson(fullName, user);
        return new ScreeningResultDto(result);
    }

    // ── My History ──
    @GetMapping("/my-history")
    public ResponseEntity<List<MyHistoryDTO>> getMyHistory(Authentication auth) {
        String username  = auth.getName();
        boolean admin    = isAdmin(auth);
        Long    tenantId = TenantContext.getTenantId();

        List<ScreeningResult> results;

        if (tenantId == null) {
            // SUPER_ADMIN → يشوف الكل
            results = screeningResultRepository.findTop50ByOrderByIdDesc();
        } else if (admin) {
            // COMPANY_ADMIN → يشوف كل شركته
            results = screeningResultRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        } else {
            // SUBSCRIBER → يشوف بياناته فقط
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
        Long id,
        String fullName,
        String createdBy,
        String riskLevel,
        LocalDateTime createdAt,
        DecisionResponse latestDecision
    ) {}
}