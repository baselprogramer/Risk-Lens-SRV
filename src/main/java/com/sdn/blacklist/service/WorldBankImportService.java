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
public class WorldBankImportService {

    private static final String WB_CSV_URL =
        "https://data.opensanctions.org/datasets/latest/worldbank_debarred/targets.simple.csv";
    private static final String SOURCE     = "WORLD_BANK";
    private static final int    BATCH_SIZE = 500;

    private final SanctionRepository sanctionRepository;
    private final OfacImportService  ofacImportService;
    private final MonitoringService  monitoringService;

    // ══════════════════════════════════════════════════
    @Transactional
    public ImportResult importWorldBank() throws Exception {
        log.info("🔄 World Bank import started from OpenSanctions...");

        URL url = new URL(WB_CSV_URL);
        URLConnection conn = url.openConnection();
        conn.setConnectTimeout(30_000);
        conn.setReadTimeout(120_000);
        conn.setRequestProperty("User-Agent", "BlacklistAPI/1.0");

        int total = 0, saved = 0;
        List<SanctionEntity> batch    = new ArrayList<>();
        // ✅ [إصلاح 2] نتتبع الـ IDs للحذف الآمن بعدين
        List<String> processedIds = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream()))) {

            String headerLine = reader.readLine();
            if (headerLine == null) return new ImportResult(0, 0);

            String[] headers = parseCsvLine(headerLine);
            int idIdx      = findIndex(headers, "id");
            int nameIdx    = findIndex(headers, "name");
            int aliasIdx   = findIndex(headers, "aliases");
            int countryIdx = findIndex(headers, "countries");
            int topicsIdx  = findIndex(headers, "topics");
            int dobIdx     = findIndex(headers, "birth_date");

            // ✅ [إصلاح 2] لا تحذف القديم هنا
            // قبل ❌: sanctionRepository.deleteBySource(SOURCE) ← data loss لو فشل
            // بعد ✅: upsert + deactivate المفقودين بعد الانتهاء

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
                    String topics  = getCol(cols, topicsIdx);
                    String dob     = getCol(cols, dobIdx);

                    // ✅ upsert
                    SanctionEntity entity = sanctionRepository
                        .findByExternalIdAndSource(externalId, SOURCE)
                        .orElse(new SanctionEntity(
                            name, SOURCE,
                            topics.isBlank() ? "World Bank Debarment" : topics,
                            null, "ENTITY", line,
                            buildAliases(aliases, name, normalizeEntityName(name)),
                            null, null, externalId,
                            dob.isBlank() ? null : dob
                        ));

                    entity.setName(name);
                    entity.setExternalId(externalId);
                    entity.setActive(true);
                    entity.setLastSyncedAt(LocalDateTime.now());

                    if (!country.isBlank()) {
                        entity.setNationality(List.of(country.split(";"))
                            .stream().map(String::trim)
                            .filter(c -> !c.isBlank()).toList());
                    }

                    // ✅ [إصلاح 1] transliterate بدل Google Translate
                    String cleanName = normalizeEntityName(name);
                    entity.setTranslatedName(
                        SmartNameMatcher.isArabic(cleanName)
                            ? SmartNameMatcher.transliterate(cleanName)
                            : cleanName
                    );

                    batch.add(entity);
                    processedIds.add(externalId);
                    total++;

                    if (batch.size() >= BATCH_SIZE) {
                        saveBatchAndIndex(batch);
                        saved += batch.size();
                        batch.clear();
                        log.info("📊 World Bank progress: {}/{}", saved, total);
                    }

                } catch (Exception e) {
                    log.debug("⚠️ World Bank row error: {}", e.getMessage());
                }
            }

            // الباقي
            if (!batch.isEmpty()) {
                saveBatchAndIndex(batch);
                saved += batch.size();
            }
        }

        // ✅ [إصلاح 2] deactivate المفقودين فقط بدل deleteAll
        if (!processedIds.isEmpty()) {
            int deleted = sanctionRepository.deactivateMissingBySource(SOURCE, processedIds);
            if (deleted > 0)
                log.info("🗑️ Deactivated {} stale {} records", deleted, SOURCE);
        }

        log.info("✅ World Bank import done — {}/{} records", saved, total);
        return new ImportResult(total, saved);
    }

    private void saveBatchAndIndex(List<SanctionEntity> batch) {
        List<SanctionEntity> saved = sanctionRepository.saveAll(batch);
        saved.forEach(e -> {
            try { ofacImportService.indexToElastic(e); }
            catch (Exception ex) { log.debug("⚠️ Index error [{}]: {}", e.getName(), ex.getMessage()); }
        });
    }

    private List<String> buildAliases(String aliases, String originalName, String cleanName) {
        List<String> list = new ArrayList<>();
        if (!aliases.isBlank()) {
            for (String a : aliases.split(";"))
                if (!a.isBlank()) list.add(a.trim());
        }
        if (!cleanName.equalsIgnoreCase(originalName.trim()) && !cleanName.isBlank())
            list.add(cleanName);
        return list.isEmpty() ? null : list;
    }

    private String normalizeEntityName(String name) {
        if (name == null) return "";
        String n = name.trim();
        n = n.replaceAll("(?i)^(MR\\.|MRS\\.|MS\\.|DR\\.|PROF\\.|SIR |LORD )\\s*", "");
        n = n.replaceAll("(?i)\\s+(LLP|LLC|LTD|INC|CORP|CO\\.|GMBH|PTE|PLC|JSC|OJSC|CJSC|OOO|ZAO)[.\\s]*$", "");
        return n.trim();
    }

    private String[] parseCsvLine(String line) {
        List<String> tokens = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') { inQuotes = !inQuotes; }
            else if (c == ',' && !inQuotes) { tokens.add(sb.toString().trim()); sb.setLength(0); }
            else { sb.append(c); }
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