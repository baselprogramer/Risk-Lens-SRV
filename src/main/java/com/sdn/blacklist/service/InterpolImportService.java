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

import com.sdn.blacklist.common.util.SmartNameMatcher;
import com.sdn.blacklist.dto.ImportResult;
import com.sdn.blacklist.entity.SanctionEntity;
import com.sdn.blacklist.monitoring.service.MonitoringService;
import com.sdn.blacklist.repository.SanctionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class InterpolImportService {

    private static final String INTERPOL_CSV_URL =
        "https://data.opensanctions.org/datasets/latest/interpol_red_notices/targets.simple.csv";
    private static final String SOURCE      = "INTERPOL";
    private static final int    BATCH_SIZE  = 500;

    private final SanctionRepository  sanctionRepository;
    private final OfacImportService   ofacImportService;
    private final MonitoringService   monitoringService;

    // ══════════════════════════════════════════════════
  

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
        // ✅ [إصلاح 2] نتتبع الـ externalIds الجديدة للحذف الآمن بعدين
        List<String> processedIds = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream()))) {

            String headerLine = reader.readLine();
            if (headerLine == null) return new ImportResult(0, 0);

            String[] headers  = parseCsvLine(headerLine);
            int idIdx      = findIndex(headers, "id");
            int nameIdx    = findIndex(headers, "name");
            int aliasIdx   = findIndex(headers, "aliases");
            int countryIdx = findIndex(headers, "countries");
            int dobIdx     = findIndex(headers, "birth_date");
            int topicsIdx  = findIndex(headers, "topics");

            // ✅ [إصلاح 2] لا تحذف القديم هنا — احذف فقط اللي ما عاد موجود بعد الـ import
            // قبل ❌: sanctionRepository.deleteBySource(SOURCE); ← لو فشل = data loss
            // بعد ✅: upsert كل record، وبعدين احذف المفقودين

            String line;
            while ((line = reader.readLine()) != null) {
                try {
                    String[] cols = parseCsvLine(line);
                    if (cols.length == 0) continue;

                    String externalId = getCol(cols, idIdx);
                    String name       = getCol(cols, nameIdx);
                    if (name.isBlank()) continue;

                    String aliases = getCol(cols, aliasIdx);
                    String country = getCol(cols, countryIdx);
                    String dob     = getCol(cols, dobIdx);
                    String topics  = getCol(cols, topicsIdx);

                    // ✅ upsert — لو موجود حدّثه، لو ما موجود أنشئه
                    SanctionEntity entity = sanctionRepository
                        .findByExternalIdAndSource(externalId, SOURCE)
                        .orElse(new SanctionEntity(
                            name, SOURCE,
                            topics.isBlank() ? "Interpol Red Notice" : topics,
                            null, "INDIVIDUAL", line,
                            aliases.isBlank() ? null : List.of(aliases.split(";")),
                            null,
                            country.isBlank() ? null : country,
                            externalId,
                            dob.isBlank() ? null : dob
                        ));

                    entity.setName(name);
                    entity.setExternalId(externalId);
                    entity.setLastSyncedAt(LocalDateTime.now());
                    entity.setActive(true);

                    // ✅ [إصلاح 1] transliterate بدل Google Translate
                    entity.setTranslatedName(SmartNameMatcher.isArabic(name)
                        ? SmartNameMatcher.transliterate(name)
                        : name);

                    batch.add(entity);
                    processedIds.add(externalId);
                    total++;

                    // حفظ كل BATCH_SIZE سجل
                    if (batch.size() >= BATCH_SIZE) {
                        saveBatchAndIndex(batch);
                        saved += batch.size();
                        batch.clear();
                        log.info("📊 Interpol progress: {}/{}", saved, total);
                    }

                } catch (Exception e) {
                    log.debug("⚠️ Interpol row error: {}", e.getMessage());
                }
            }

            // الباقي
            if (!batch.isEmpty()) {
                saveBatchAndIndex(batch);
                saved += batch.size();
                batch.clear();
            }
        }

        // ✅ [إصلاح 2] احذف فقط اللي ما عاد موجود في المصدر
        // بدل deleteAll → احذف المفقودين فقط
        if (!processedIds.isEmpty()) {
            int deleted = sanctionRepository.deactivateMissingInterpol(processedIds);
            if (deleted > 0)
                log.info("🗑️ Deactivated {} stale INTERPOL records", deleted);
        }

        log.info("✅ Interpol import done — {}/{} records", saved, total);
        return new ImportResult(total, saved);
    }

    // ══════════════════════════════════════════
    //  saveBatchAndIndex — save + index معاً
    // ══════════════════════════════════════════
    private void saveBatchAndIndex(List<SanctionEntity> batch) {
        List<SanctionEntity> saved = sanctionRepository.saveAll(batch);
        saved.forEach(e -> {
            try {
                ofacImportService.indexToElastic(e);
            } catch (Exception ex) {
                log.debug("⚠️ Index error for [{}]: {}", e.getName(), ex.getMessage());
            }
        });
    }

    // ══════════════════════════════════════════
    //  CSV Parser — يدعم الـ quoted fields
    // ══════════════════════════════════════════
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
        for (int i = 0; i < headers.length; i++)
            if (headers[i].trim().equalsIgnoreCase(name)) return i;
        return -1;
    }

    private String getCol(String[] cols, int idx) {
        if (idx < 0 || idx >= cols.length) return "";
        return cols[idx] == null ? "" : cols[idx].trim();
    }
}