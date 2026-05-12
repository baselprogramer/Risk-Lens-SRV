package com.sdn.blacklist.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.sdn.blacklist.monitoring.service.MonitoringService;
import com.sdn.blacklist.service.EuImportService;
import com.sdn.blacklist.service.OfacImportService;
import com.sdn.blacklist.service.UkImportService;
import com.sdn.blacklist.service.UnImportService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class BlacklistScheduler {

    private final OfacImportService ofacImportService;
    private final UnImportService   unImportService;
    private final EuImportService   euImportService;
    private final UkImportService   ukImportService;
    private final MonitoringService monitoringService; 


    // ══════════════════════════════════════════════════
    //  كل 7 أيام — الأحد الساعة 2:00 صباحاً
    //  cron: ثانية دقيقة ساعة يوم_شهر شهر يوم_أسبوع
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
            log.info("📥 [1/4] Importing OFAC...");
            ofacImportService.importOfac();
            log.info("✅ [1/4] OFAC import completed");
            success++;
        } catch (Exception e) {
            failed++;
            log.error("❌ [1/4] OFAC import FAILED — List may be unavailable!");
            log.error("   Reason: {}", e.getMessage());
            notifyUnavailable("OFAC", e);
        }

        // ── UN ──
        try {
            log.info("📥 [2/4] Importing UN...");
            unImportService.importUn();
            log.info("✅ [2/4] UN import completed");
            success++;
        } catch (Exception e) {
            failed++;
            log.error("❌ [2/4] UN import FAILED — List may be unavailable!");
            log.error("   Reason: {}", e.getMessage());
            notifyUnavailable("UN", e);
        }

        // ── EU ──
        try {
            log.info("📥 [3/4] Importing EU...");
            euImportService.importEu();
            log.info("✅ [3/4] EU import completed");
            success++;
        } catch (Exception e) {
            failed++;
            log.error("❌ [3/4] EU import FAILED — List may be unavailable!");
            log.error("   Reason: {}", e.getMessage());
            notifyUnavailable("EU", e);
        }

        // ── UK ──
        try {
            log.info("📥 [4/4] Importing UK...");
            ukImportService.importUk();
            log.info("✅ [4/4] UK import completed");
            success++;
        } catch (Exception e) {
            failed++;
            log.error("❌ [4/4] UK import FAILED — List may be unavailable!");
            log.error("   Reason: {}", e.getMessage());
            notifyUnavailable("UK", e);
        }

        // ── Summary ──
        log.info("╔══════════════════════════════════════════╗");
        if (failed == 0) {
            log.info("║  ✅ All 4 lists synced successfully!     ║");
        } else {
            log.warn("║  ⚠️  Sync finished with issues:           ║");
            log.warn("║     ✅ Success : {}                        ║", success);
            log.warn("║     ❌ Failed  : {}                        ║", failed);
        }
        log.info("╚══════════════════════════════════════════╝");
    }

    // ══════════════════════════════════════════════════
    //  إشعار عند فشل استيراد قائمة
    // ══════════════════════════════════════════════════
    private void notifyUnavailable(String source, Exception e) {
        // الإشعار الأساسي عبر log.error (يظهر في الـ monitoring)
        log.error("🚨 ALERT: {} sanctions list is UNAVAILABLE or UNREACHABLE", source);
        log.error("   This means the {} list was NOT updated in this cycle!", source);
        log.error("   Action required: Check source URL and network connectivity");
        log.error("   Stack trace: ", e);

        monitoringService.reportImportFailure(source, e.getMessage());


        // ══════════════════════════════════════════
        // هنا نقدر نضيف إشعارات إضافية مستقبلاً:
        // ══════════════════════════════════════════

        // 1. Email notification:
        // emailService.sendAlert(
        //     "sanctions-team@yourbank.com",
        //     source + " List Unavailable",
        //     "Failed to sync " + source + ": " + e.getMessage()
        // );

        // 2. Slack/Teams webhook:
        // slackService.sendMessage("#compliance-alerts",
        //     "🚨 *" + source + " sanctions list failed to sync!*\n" + e.getMessage()
        // );

        // 3. Database alert log:
        // alertRepository.save(new SyncAlert(source, e.getMessage(), LocalDateTime.now()));
    }
}