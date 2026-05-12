package com.sdn.blacklist.common.service;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sdn.blacklist.common.util.CountryRisk;
import com.sdn.blacklist.common.repository.CountryRiskRepository;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class CountryRiskService {

    private final CountryRiskRepository repository;
    private final ObjectMapper          objectMapper;

    public CountryRiskService(CountryRiskRepository repository, ObjectMapper objectMapper) {
        this.repository   = repository;
        this.objectMapper = objectMapper;
    }

    // ── يشتغل عند البدء لو DB فارغة ──
    @PostConstruct
    public void initOnStartup() {
        if (repository.count() == 0) {
            log.info("🌍 Loading initial FATF country risk data...");
            loadFromLocalFile();
        } else {
            log.info("✅ Country risk data already loaded ({} countries)", repository.count());
        }
    }

    // ── كل أول الشهر الساعة 12 ليل ──
    @Scheduled(cron = "0 0 0 1 * *")
    public void scheduledUpdate() {
        log.info("🔄 Monthly FATF country risk update...");
        loadFromLocalFile();
    }

    // ── تحميل من الملف المحلي ──
    public void loadFromLocalFile() {
        try (InputStream is = getClass().getResourceAsStream("/fatf-countries.json")) {
            if (is == null) {
                log.error("❌ fatf-countries.json not found in resources");
                return;
            }
            List<CountryRisk> countries = objectMapper.readValue(
                is, new TypeReference<List<CountryRisk>>() {});

            // تحديث الـ timestamp
            countries.forEach(c -> c.setLastUpdated(LocalDateTime.now()));

            repository.saveAll(countries);
            log.info("✅ Loaded {} countries from fatf-countries.json", countries.size());

        } catch (Exception e) {
            log.error("❌ Failed to load FATF data: {}", e.getMessage());
        }
    }

    // ── الحصول على الـ score حسب الكود ──
    public double getRiskScore(String countryCode) {
        if (countryCode == null || countryCode.isBlank()) return 0.0;
        return repository.findById(countryCode.toUpperCase())
            .map(CountryRisk::getRiskScore)
            .orElse(0.0);
    }

    public String getRiskTier(String countryCode) {
        if (countryCode == null || countryCode.isBlank()) return "LOW";
        return repository.findById(countryCode.toUpperCase())
            .map(CountryRisk::getRiskTier)
            .orElse("LOW");
    }
}