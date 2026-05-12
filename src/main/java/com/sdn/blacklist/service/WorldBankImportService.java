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
public class WorldBankImportService {

    //  OpenSanctions CSV للـ World Bank — مجاني ومحدّث
    private static final String WB_CSV_URL =
        "https://data.opensanctions.org/datasets/latest/worldbank_debarred/targets.simple.csv";
    private static final String SOURCE = "WORLD_BANK";

    private final SanctionRepository  sanctionRepository;
    private final OfacImportService    ofacImportService; 
    private final com.sdn.blacklist.monitoring.service.MonitoringService monitoringService; 


    //  كل شهر — أول يوم الساعة 4 صباحاً
    @Scheduled(cron = "0 0 4 1 * *")
    public void scheduledSync() {
        log.info("🔄 Scheduled World Bank sync...");
        try {
            importWorldBank();
        } catch (Exception e) {
            log.error("❌ Scheduled World Bank sync failed: {}", e.getMessage());
            monitoringService.reportImportFailure("WORLD_BANK", e.getMessage()); 
        }
    }

    @Transactional
    public ImportResult importWorldBank() throws Exception {
        log.info("🔄 World Bank import started from OpenSanctions...");

        URL url = new URL(WB_CSV_URL);
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

            String[] headers = parseCsvLine(headerLine);
            int idIdx       = findIndex(headers, "id");
            int nameIdx     = findIndex(headers, "name");
            int aliasIdx    = findIndex(headers, "aliases");
            int countryIdx  = findIndex(headers, "countries");
            int topicsIdx   = findIndex(headers, "topics");
            int dobIdx      = findIndex(headers, "birth_date");

            //  احذف القديم
            sanctionRepository.deleteBySource(SOURCE);

            String line;
            while ((line = reader.readLine()) != null) {
                try {
                    String[] cols = parseCsvLine(line);
                    if (cols.length == 0) continue;

                    String externalId = getCol(cols, idIdx);
                    String rawName    = getCol(cols, nameIdx);
                    if (rawName.isBlank()) continue;
                    //  الاسم الأصلي للعرض، الاسم المنظّف للبحث
                    String name       = rawName;

                    String aliases = getCol(cols, aliasIdx);
                    String country = getCol(cols, countryIdx);
                    String topics  = getCol(cols, topicsIdx);
                    String dob     = getCol(cols, dobIdx);

                    SanctionEntity entity = new SanctionEntity(
                        name,           // الاسم الأصلي للعرض
                        SOURCE,
                        topics.isBlank() ? "World Bank Debarment" : topics,
                        null,
                        "ENTITY",
                        line,
                        buildAliases(aliases, name, normalizeEntityName(name)),
                        null,
                        country.isBlank() ? null : country,
                        externalId,
                        dob.isBlank() ? null : dob
                    );
                    entity.setExternalId(externalId);
                    entity.setTranslatedName(NameTranslator.translateName(normalizeEntityName(name)));
                    entity.setLastSyncedAt(LocalDateTime.now());

                    batch.add(entity);
                    total++;

                    if (batch.size() >= 500) {
                        List<SanctionEntity> saved500 = sanctionRepository.saveAll(batch);
                        saved500.forEach(e -> {
                            try { ofacImportService.indexToElastic(e); }
                            catch (Exception ex) { log.debug("Index error: {}", ex.getMessage()); }
                        });
                        saved += saved500.size();
                        batch.clear();
                        log.info("World Bank progress: {}/{}", saved, total);
                    }

                } catch (Exception e) {
                    log.debug("World Bank row error: {}", e.getMessage());
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

        log.info("✅ World Bank import done — {}/{} records", saved, total);
        return new ImportResult(total, saved);
    }

    /**
     * ✅ ينظّف اسم الشركة أو الشخص:
     * - يشيل الألقاب: MR. MRS. MS. DR. PROF.
     * - يشيل الأشكال القانونية: LLP LLC INC LTD CO. CORP
     * - يحوّل لأحرف صغيرة ليُسهل المطابقة
     */
    /**
     * ✅ يبني قائمة الأسماء البديلة تشمل:
     * - الأسماء البديلة الأصلية
     * - الاسم المنظّف (بدون MR. / LLP / إلخ)
     */
    private List<String> buildAliases(String aliases, String originalName, String cleanName) {
        List<String> list = new ArrayList<>();
        // أضف الأسماء البديلة الأصلية
        if (!aliases.isBlank()) {
            for (String a : aliases.split(";")) {
                if (!a.isBlank()) list.add(a.trim());
            }
        }
        // أضف الاسم المنظّف كـ alias لو مختلف عن الأصلي
        if (!cleanName.equalsIgnoreCase(originalName.trim()) && !cleanName.isBlank()) {
            list.add(cleanName);
        }
        return list.isEmpty() ? null : list;
    }

    private String normalizeEntityName(String name) {
        if (name == null) return "";
        String n = name.trim();

        // شيل الألقاب من البداية
        n = n.replaceAll("(?i)^(MR\\.|MRS\\.|MS\\.|DR\\.|PROF\\.|SIR |LORD )\\s*", "");

        // شيل الأشكال القانونية من النهاية
        n = n.replaceAll("(?i)\\s+(LLP|LLC|LTD|INC|CORP|CO\\.|GMBH|PTE|PLC|JSC|OJSC|CJSC|OOO|ZAO)[.\\s]*$", "");

        return n.trim();
    }

    //  CSV Parser يدعم الـ quoted fields
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