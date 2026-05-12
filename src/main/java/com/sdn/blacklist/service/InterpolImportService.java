package com.sdn.blacklist.service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URL;
import java.net.URLConnection;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sdn.blacklist.common.util.NameTranslator;
import com.sdn.blacklist.dto.ImportResult;
import com.sdn.blacklist.entity.SanctionEntity;
import com.sdn.blacklist.repository.SanctionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class InterpolImportService {

    private static final String INTERPOL_CSV_URL =
        "https://data.opensanctions.org/datasets/latest/interpol_red_notices/targets.simple.csv";
    private static final String SOURCE = "INTERPOL";

    private final SanctionRepository   sanctionRepository;
    private final OfacImportService    ofacImportService; //  للـ indexToElastic
    private final com.sdn.blacklist.monitoring.service.MonitoringService monitoringService; // ← أضف


    //  كل أسبوع — الأحد الساعة 2 صباحاً
   @Scheduled(cron = "0 0 2 * * SUN")
    public void scheduledSync() {
        log.info("🔄 Scheduled Interpol sync...");
        try {
            importInterpol();
        } catch (Exception e) {
            log.error("❌ Scheduled Interpol sync failed: {}", e.getMessage());
            monitoringService.reportImportFailure("INTERPOL", e.getMessage()); // ← أضف
        }
    }

    @Transactional
    public ImportResult importInterpol() throws Exception {
        log.info("🔄 Interpol import started from OpenSanctions...");

        URL url = new URL(INTERPOL_CSV_URL);
        URLConnection conn = url.openConnection();
        conn.setConnectTimeout(30_000);
        conn.setReadTimeout(120_000);
        conn.setRequestProperty("User-Agent", "BlacklistAPI/1.0");

        int total = 0, saved = 0;
        List<SanctionEntity> batch = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream()))) {

            String headerLine = reader.readLine();
            if (headerLine == null) return new ImportResult(0, 0);

            // تحليل العناوين
            String[] headers = parseCsvLine(headerLine);
            int idIdx       = findIndex(headers, "id");
            int nameIdx     = findIndex(headers, "name");
            int aliasIdx    = findIndex(headers, "aliases");
            int countryIdx  = findIndex(headers, "countries");
            int dobIdx      = findIndex(headers, "birth_date");
            int topicsIdx   = findIndex(headers, "topics");

            // احذف القديم
            sanctionRepository.deleteBySource(SOURCE);

            String line;
            while ((line = reader.readLine()) != null) {
                try {
                    String[] cols = parseCsvLine(line);
                    if (cols.length == 0) continue;

                    String externalId = getCol(cols, idIdx);
                    String name       = getCol(cols, nameIdx);
                    if (name.isBlank()) continue;

                    String aliases  = getCol(cols, aliasIdx);
                    String country  = getCol(cols, countryIdx);
                    String dob      = getCol(cols, dobIdx);
                    String topics   = getCol(cols, topicsIdx);

                    SanctionEntity entity = new SanctionEntity(
                        name,
                        SOURCE,
                        topics.isBlank() ? "Interpol Red Notice" : topics,
                        null,
                        "INDIVIDUAL",
                        line,
                        aliases.isBlank() ? null : List.of(aliases.split(";")),
                        null,
                        country.isBlank() ? null : country,
                        externalId,
                        dob.isBlank() ? null : dob
                    );
                    entity.setExternalId(externalId);
                    entity.setTranslatedName(NameTranslator.translateName(name));
                    entity.setLastSyncedAt(LocalDateTime.now());

                    batch.add(entity);
                    total++;

                    //  حفظ كل 500 سجل
                    if (batch.size() >= 500) {
                        List<SanctionEntity> saved500 = sanctionRepository.saveAll(batch);
                        saved500.forEach(e -> {
                            try { ofacImportService.indexToElastic(e); }
                            catch (Exception ex) { log.debug("Index error: {}", ex.getMessage()); }
                        });
                        saved += saved500.size();
                        batch.clear();
                        log.info("Interpol progress: {}/{}", saved, total);
                    }

                } catch (Exception e) {
                    log.debug("Interpol row error: {}", e.getMessage());
                }
            }

            //  الباقي
            if (!batch.isEmpty()) {
                List<SanctionEntity> remaining = sanctionRepository.saveAll(batch);
                remaining.forEach(e -> {
                    try { ofacImportService.indexToElastic(e); }
                    catch (Exception ex) { log.debug("Index error: {}", ex.getMessage()); }
                });
                saved += remaining.size();
            }
        }

        log.info("✅ Interpol import done — {}/{} records", saved, total);
        return new ImportResult(total, saved);
    }

    // ── CSV Parser بسيط يدعم الـ quoted fields ──
    private String[] parseCsvLine(String line) {
        List<String> tokens = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                tokens.add(sb.toString().trim());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        tokens.add(sb.toString().trim());
        return tokens.toArray(new String[0]);
    }

    private int findIndex(String[] headers, String name) {
        for (int i = 0; i < headers.length; i++) {
            if (headers[i].trim().equalsIgnoreCase(name)) return i;
        }
        return -1;
    }

    private String getCol(String[] cols, int idx) {
        if (idx < 0 || idx >= cols.length) return "";
        return cols[idx] == null ? "" : cols[idx].trim();
    }
}