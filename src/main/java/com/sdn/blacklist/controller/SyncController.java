package com.sdn.blacklist.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sdn.blacklist.config.ApiVersion;
import com.sdn.blacklist.dto.ImportResult;
import com.sdn.blacklist.repository.SanctionRepository;
import com.sdn.blacklist.service.EuImportService;
import com.sdn.blacklist.service.InterpolImportService;
import com.sdn.blacklist.service.OfacImportService;
import com.sdn.blacklist.service.UkImportService;
import com.sdn.blacklist.service.UnImportService;
import com.sdn.blacklist.service.WorldBankImportService;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping(ApiVersion.V1 + "/admin/sync")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Sync", description = "مزامنة كل قوائم العقوبات")

public class SyncController {

    private final OfacImportService      ofacImportService;
    private final UnImportService        unImportService;
    private final EuImportService        euImportService;
    private final UkImportService        ukImportService;
   // private final FbiImportService       fbiImportService;        
    private final WorldBankImportService worldBankImportService; 
    private final InterpolImportService   interpolImportService;  
    private final SanctionRepository     sanctionRepository;    

    // ── Status كل القوائم ──────────────────────────────────
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        return ResponseEntity.ok(Map.of(
            "OFAC",       sanctionRepository.countBySource("OFAC"),
            "EU",         sanctionRepository.countBySource("EU"),
            "UN",         sanctionRepository.countBySource("UN"),
            "UK",         sanctionRepository.countBySource("UK"),
            "INTERPOL",        sanctionRepository.countBySource("INTERPOL"),
            "WORLD_BANK", sanctionRepository.countBySource("WORLD_BANK"),
            "LOCAL",      sanctionRepository.countBySource("LOCAL")
        ));
    }

    // ── Sync All ───────────────────────────────────────────
    @PostMapping("/all")
    public ResponseEntity<String> syncAll() {
        try {
            ofacImportService.importOfac();
            unImportService.importUn();
            euImportService.importEu();
            ukImportService.importUk();
            //fbiImportService.syncNow();
            worldBankImportService.importWorldBank();
            interpolImportService.importInterpol();
            return ResponseEntity.ok("✅ All lists synced successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("❌ Failed: " + e.getMessage());
        }
    }

    // ── القوائم الأصلية ────────────────────────────────────
    @PostMapping("/ofac")
    public ResponseEntity<String> syncOfac() {
        try { ofacImportService.importOfac(); return ResponseEntity.ok("✅ OFAC synced"); }
        catch (Exception e) { return ResponseEntity.status(500).body("❌ " + e.getMessage()); }
    }

    @PostMapping("/un")
    public ResponseEntity<String> syncUn() {
        try { unImportService.importUn(); return ResponseEntity.ok("✅ UN synced"); }
        catch (Exception e) { return ResponseEntity.status(500).body("❌ " + e.getMessage()); }
    }

    @PostMapping("/eu")
    public ResponseEntity<String> syncEu() {
        try { euImportService.importEu(); return ResponseEntity.ok("✅ EU synced"); }
        catch (Exception e) { return ResponseEntity.status(500).body("❌ " + e.getMessage()); }
    }

    @PostMapping("/uk")
    public ResponseEntity<String> syncUk() {
        try { ukImportService.importUk(); return ResponseEntity.ok("✅ UK synced"); }
        catch (Exception e) { return ResponseEntity.status(500).body("❌ " + e.getMessage()); }
    }

    // ── ✅ القوائم الجديدة ─────────────────────────────────
  

    @PostMapping("/interpol")
    public ResponseEntity<String> syncInterpol() {
        try {
            var result = interpolImportService.importInterpol();
            return ResponseEntity.ok("✅ Interpol synced — " + result.getSavedRecords() + " records");
        } catch (Exception e) { return ResponseEntity.status(500).body("❌ " + e.getMessage()); }
    }

    @PostMapping("/world-bank")
    public ResponseEntity<String> syncWorldBank() {
        try {
            ImportResult result = worldBankImportService.importWorldBank();
            return ResponseEntity.ok("✅ World Bank synced — " + result.getSavedRecords() + " records");
        } catch (Exception e) { return ResponseEntity.status(500).body("❌ " + e.getMessage()); }
    }
}