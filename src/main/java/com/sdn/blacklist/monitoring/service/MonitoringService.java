package com.sdn.blacklist.monitoring.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.sdn.blacklist.monitoring.entity.MonitoringAlert;
import com.sdn.blacklist.monitoring.repository.MonitoringAlertRepository;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class MonitoringService {

    private final MonitoringAlertRepository alertRepository;
    private final ElasticsearchClient esClient;
    private final com.sdn.blacklist.screening.repository.ScreeningResultRepository screeningResultRepository;
    private final com.sdn.blacklist.tenant.repository.TenantRepository tenantRepository;

    // ── إنشاء Alert ───────────────────────────────────────────────
    public MonitoringAlert createAlert(String type, String severity,
                                        String message, Long tenantId, String source) {
        MonitoringAlert alert = new MonitoringAlert();
        alert.setType(type);
        alert.setSeverity(severity);
        alert.setMessage(message);
        alert.setTenantId(tenantId);
        alert.setSource(source);
        alertRepository.save(alert);
        log.warn("🚨 Alert [{}] {}: {}", severity, type, message);
        return alert;
    }

    // ── Resolve Alert ─────────────────────────────────────────────
    public void resolve(Long id) {
        alertRepository.findById(id).ifPresent(alert -> {
            alert.setResolved(true);
            alert.setResolvedAt(LocalDateTime.now());
            alertRepository.save(alert);
        });
    }

    // ── جلب الـ Alerts ────────────────────────────────────────────
    public List<MonitoringAlert> getActive() {
        return alertRepository.findByResolvedFalseOrderByCreatedAtDesc();
    }

    public List<MonitoringAlert> getAll() {
        return alertRepository.findAllByOrderByCreatedAtDesc();
    }

    public long getActiveCount() {
        return alertRepository.countByResolvedFalse();
    }

    // ══════════════════════════════════════════════════════════════
    // Scheduled Checks — كل دقيقة
    // ══════════════════════════════════════════════════════════════

    // ── 1. فحص Elasticsearch ──────────────────────────────────────
   @Scheduled(fixedDelay = 60000)
public void checkElasticsearch() {
    try {
        esClient.ping();
    } catch (Exception e) {
        long recent = alertRepository.countByTypeAndCreatedAtAfter(
            "ES_DOWN", LocalDateTime.now().minusMinutes(5));
        if (recent == 0) {
            createAlert("ES_DOWN", "CRITICAL",
                "Elasticsearch لا يستجيب: " + e.getMessage(),
                null, "ELASTICSEARCH");
        }
    }
}

    // ── 2. فحص CRITICAL Spike ─────────────────────────────────────
    @Scheduled(fixedDelay = 300000) // كل 5 دقائق
    public void checkCriticalSpike() {
        try {
            LocalDateTime since = LocalDateTime.now().minusMinutes(10);
            long criticalCount = screeningResultRepository
                .countByRiskLevelAndCreatedAtAfter(
                    com.sdn.blacklist.screening.model.RiskLevel.CRITICAL, since);

            if (criticalCount >= 5) {
                long recent = alertRepository.countByTypeAndCreatedAtAfter(
                    "CRITICAL_SPIKE", LocalDateTime.now().minusMinutes(15));
                if (recent == 0) {
                    createAlert("CRITICAL_SPIKE", "WARNING",
                        criticalCount + " فحص CRITICAL في آخر 10 دقائق",
                        null, "SCREENING");
                }
            }
        } catch (Exception e) {
            log.error("Error checking critical spike: {}", e.getMessage());
        }
    }

    // ── 3. فحص Rate Limit ─────────────────────────────────────────
    public void checkRateLimit(Long tenantId, String tenantName,
                                int used, int limit) {
        double percent = (double) used / limit * 100;
        if (percent >= 90) {
            long recent = alertRepository.countByTypeAndCreatedAtAfter(
                "RATE_LIMIT", LocalDateTime.now().minusMinutes(30));
            if (recent == 0) {
                createAlert("RATE_LIMIT", percent >= 100 ? "CRITICAL" : "WARNING",
                    tenantName + " استخدم " + (int) percent + "% من الـ rate limit اليومي",
                    tenantId, "RATE_LIMIT");
            }
        }
    }

    // ── 4. فشل الاستيراد ──────────────────────────────────────────
    public void reportImportFailure(String source, String error) {
        long recent = alertRepository.countByTypeAndCreatedAtAfter(
            "IMPORT_FAILED", LocalDateTime.now().minusHours(1));
        if (recent == 0) {
            createAlert("IMPORT_FAILED", "WARNING",
                "فشل استيراد قائمة " + source + ": " + error,
                null, source);
        }
    }

    public List<MonitoringAlert> getAlertsByTenant(Long tenantId) {
    return alertRepository.findByTenantIdAndResolvedFalseOrderByCreatedAtDesc(tenantId);
        }

        public List<MonitoringAlert> getAllAlertsByTenant(Long tenantId) {
            return alertRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        }
}