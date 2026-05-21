package com.sdn.blacklist.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.sdn.blacklist.monitoring.service.MonitoringService;
import com.sdn.blacklist.service.EuImportService;
import com.sdn.blacklist.service.InterpolImportService;
import com.sdn.blacklist.service.OfacImportService;
import com.sdn.blacklist.service.UkImportService;
import com.sdn.blacklist.service.UnImportService;
import com.sdn.blacklist.service.WorldBankImportService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class BlacklistScheduler {

    private final OfacImportService      ofacImportService;
    private final UnImportService        unImportService;
    private final EuImportService        euImportService;
    private final UkImportService        ukImportService;
    private final InterpolImportService  interpolImportService;
    private final WorldBankImportService worldBankImportService;
    private final MonitoringService      monitoringService;

    // ══════════════════════════════════════════════════
    //  كل 7 أيام — الأحد الساعة 2:00 صباحاً
    //  6 قوائم — كل واحدة بتعمل indexToElastic لحالها
    // ══════════════════════════════════════════════════
    @Scheduled(cron = "0 0 2 * * SUN")
    public void weeklySyncAll() {

        log.info("╔══════════════════════════════════════════╗");
        log.info("║  🔄 Weekly Sanctions Sync — STARTED      ║");
        log.info("╚══════════════════════════════════════════╝");

        int success = 0;
        int failed  = 0;

        // ── OFAC ──
        try {
            log.info("📥 [1/6] Importing OFAC...");
            ofacImportService.importOfac();
            log.info("✅ [1/6] OFAC import completed");
            success++;
        } catch (Exception e) {
            failed++;
            log.error("❌ [1/6] OFAC import FAILED: {}", e.getMessage());
            notifyUnavailable("OFAC", e);
        }

        // ── UN ──
        try {
            log.info("📥 [2/6] Importing UN...");
            unImportService.importUn();
            log.info("✅ [2/6] UN import completed");
            success++;
        } catch (Exception e) {
            failed++;
            log.error("❌ [2/6] UN import FAILED: {}", e.getMessage());
            notifyUnavailable("UN", e);
        }

        // ── EU ──
        try {
            log.info("📥 [3/6] Importing EU...");
            euImportService.importEu();
            log.info("✅ [3/6] EU import completed");
            success++;
        } catch (Exception e) {
            failed++;
            log.error("❌ [3/6] EU import FAILED: {}", e.getMessage());
            notifyUnavailable("EU", e);
        }

        // ── UK ──
        try {
            log.info("📥 [4/6] Importing UK...");
            ukImportService.importUk();
            log.info("✅ [4/6] UK import completed");
            success++;
        } catch (Exception e) {
            failed++;
            log.error("❌ [4/6] UK import FAILED: {}", e.getMessage());
            notifyUnavailable("UK", e);
        }

        // ── INTERPOL ──
        try {
            log.info("📥 [5/6] Importing INTERPOL...");
            interpolImportService.importInterpol();
            log.info("✅ [5/6] INTERPOL import completed");
            success++;
        } catch (Exception e) {
            failed++;
            log.error("❌ [5/6] INTERPOL import FAILED: {}", e.getMessage());
            notifyUnavailable("INTERPOL", e);
        }

        // ── WORLD BANK ──
        try {
            log.info("📥 [6/6] Importing WORLD BANK...");
            worldBankImportService.importWorldBank();
            log.info("✅ [6/6] WORLD BANK import completed");
            success++;
        } catch (Exception e) {
            failed++;
            log.error("❌ [6/6] WORLD BANK import FAILED: {}", e.getMessage());
            notifyUnavailable("WORLD_BANK", e);
        }

        // ── Summary ──
        log.info("╔══════════════════════════════════════════╗");
        if (failed == 0) {
            log.info("║  ✅ All 6 lists synced successfully!     ║");
        } else {
            log.warn("║  ⚠️  Sync finished: ✅{} ❌{}              ║", success, failed);
        }
        log.info("╚══════════════════════════════════════════╝");

        // ✅ reindexLocal فقط — القوائم الدولية عملت indexToElastic لحالها
        try {
            log.info("📥 Reindexing Local Sanctions...");
            ofacImportService.reindexLocal();
            log.info("✅ Local reindex completed");
        } catch (Exception e) {
            log.error("❌ Local reindex FAILED: {}", e.getMessage());
        }
    }

    // ══════════════════════════════════════════════════
    //  إشعار عند فشل استيراد قائمة
    // ══════════════════════════════════════════════════
    private void notifyUnavailable(String source, Exception e) {
        log.error("🚨 ALERT: {} is UNAVAILABLE or UNREACHABLE", source);
        log.error("   Action required: Check source URL and network connectivity");
        monitoringService.reportImportFailure(source, e.getMessage());
    }
}