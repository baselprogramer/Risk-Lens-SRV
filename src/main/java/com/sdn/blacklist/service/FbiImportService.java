package com.sdn.blacklist.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sdn.blacklist.entity.SanctionEntity;
import com.sdn.blacklist.repository.SanctionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class FbiImportService {

    private static final String FBI_API      = "https://api.fbi.gov/wanted/v1/list";
    private static final String SOURCE       = "FBI";
    private static final int    MAX_PAGES    = 20;

    private final SanctionRepository sanctionRepository;
    private final ObjectMapper        mapper = new ObjectMapper();
    private final HttpClient          http   = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(15))
        .build();

    //  يشتغل كل يوم الساعة 3 صباحاً
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void syncFbi() {
        log.info("🔄 FBI sync started...");
        int total = 0, added = 0, updated = 0;

        try {
            int page = 1;
            int totalFetched = 0;
            List<SanctionEntity> allEntities = new ArrayList<>();

            while (page <= MAX_PAGES) {
                String url = FBI_API + "?page=" + page;
                String body = get(url);
                if (body == null) break;

                JsonNode root  = mapper.readTree(body);
                JsonNode items = root.path("items");
                if (!items.isArray() || items.isEmpty()) break;

                List<SanctionEntity> batch = new ArrayList<>();
                for (JsonNode item : items) {
                    SanctionEntity entity = buildEntity(item);
                    if (entity != null) batch.add(entity);
                }

                allEntities.addAll(batch);
                totalFetched += items.size();
                page++;
                Thread.sleep(300);
            }

            //  احذف القديم وحفظ الجديد فقط لو في بيانات
            if (!allEntities.isEmpty()) {
                sanctionRepository.deleteBySource(SOURCE);
                sanctionRepository.saveAll(allEntities);
                added = allEntities.size();
            }

            log.info("✅ FBI sync done — {} imported", added);

        } catch (Exception e) {
            log.error("❌ FBI sync failed: {}", e.getMessage());
        }
    }

    @Transactional
    public void saveBatch(java.util.List<SanctionEntity> batch) {
        sanctionRepository.saveAll(batch);
    }

    @Transactional
    public void deleteOldRecords() {
        sanctionRepository.deleteBySource(SOURCE);
    }

    // اختبار الاتصال
    public String testConnection() {
        String body = get(FBI_API + "?page=1");
        if (body == null) return "NULL — connection failed";
        return body.substring(0, Math.min(300, body.length()));
    }

    //  تشغيل يدوي عند الطلب
    @Transactional
    public int syncNow() {
        syncFbi();
        return (int) sanctionRepository.countBySource(SOURCE);
    }

    private SanctionEntity buildEntity(JsonNode item) {
        try {
            String uid      = item.path("uid").asText("");
            String title    = item.path("title").asText("");
            String subjects = item.path("subjects").toString();
            String status   = item.path("status").asText("");

            if (title.isBlank()) return null;

            // aliases من الأسماء البديلة
            JsonNode aliasNode = item.path("aliases");
            List<String> aliases = new ArrayList<>();
            if (aliasNode.isArray()) {
                for (JsonNode a : aliasNode) aliases.add(a.asText());
            }

            // الجنسية
            JsonNode natNode = item.path("nationality");
            String nationality = natNode.isArray() && !natNode.isEmpty()
                ? natNode.get(0).asText() : null;

            // تاريخ الميلاد
            String dob = item.path("dates_of_birth").isArray() && !item.path("dates_of_birth").isEmpty()
                ? item.path("dates_of_birth").get(0).asText() : null;

            SanctionEntity entity = new SanctionEntity(
                title,
                SOURCE,
                subjects,           // program = subjects (terrorism, crimes, etc.)
                null,               // ofacUid
                "INDIVIDUAL",
                item.toString(),    // rawData
                aliases.isEmpty() ? null : aliases,
                null,               // addresses
                nationality,
                uid,               // ids = uid
                dob
            );

            entity.setExternalId(uid);
            entity.setLastSyncedAt(LocalDateTime.now());
            return entity;

        } catch (Exception e) {
            log.debug("FBI entity build error: {}", e.getMessage());
            return null;
        }
    }

    private String get(String url) {
        try {
            HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36")
                .header("Accept", "application/json, text/plain, */*")
                .header("Accept-Language", "en-US,en;q=0.9")
                .timeout(Duration.ofSeconds(30))
                .GET()
                .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            log.info("FBI HTTP status: {} for {}", res.statusCode(), url);
            if (res.statusCode() == 200) return res.body();
            log.warn("FBI non-200: {} body: {}", res.statusCode(), res.body().substring(0, Math.min(200, res.body().length())));
            return null;
        } catch (Exception e) {
            log.warn("FBI GET error: {} for {}", e.getMessage(), url);
            return null;
        }
    }
}