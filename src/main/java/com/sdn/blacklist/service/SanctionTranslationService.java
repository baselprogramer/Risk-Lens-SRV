package com.sdn.blacklist.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sdn.blacklist.common.util.SmartNameMatcher;
import com.sdn.blacklist.entity.SanctionEntity;
import com.sdn.blacklist.local.entity.LocalSanctionEntity;
import com.sdn.blacklist.local.repository.LocalSanctionRepository;
import com.sdn.blacklist.repository.SanctionRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class SanctionTranslationService {

    private final LocalSanctionRepository localRepo;
    private final SanctionRepository      globalRepo;
    private final OfacImportService       ofacImportService;

    public SanctionTranslationService(LocalSanctionRepository localRepo,
                                      SanctionRepository globalRepo,
                                      OfacImportService ofacImportService) {
        this.localRepo        = localRepo;
        this.globalRepo       = globalRepo;
        this.ofacImportService = ofacImportService;
    }

    // ══════════════════════════════════════════
    //  generateTranslationsForAll
    //  يولّد الـ translatedName لكل record ناقص
    //  ويعمل reindex في ES
    //
    //  ✅ transliterate بدل Google Translate:
    //  - فوري (لا network)
    //  - لا يتحجب
    //  - كافي للـ fuzzy matching في ES
    // ══════════════════════════════════════════
    @Transactional
    public void generateTranslationsForAll() {
        translateLocal();
        translateGlobal();
    }

    // ── Local Sanctions ──
    @Transactional
    public void translateLocal() {
        List<LocalSanctionEntity> locals = localRepo.findAll();
        int count = 0, skipped = 0;

        for (LocalSanctionEntity entity : locals) {
            try {
                if (entity.getName() == null || entity.getName().isBlank()) continue;

                // ✅ فقط لو ناقص translatedName أو نفس الاسم العربي
                if (needsTranslation(entity.getName(), entity.getTranslatedName())) {
                    String translated = buildTranslation(entity.getName());
                    entity.setTranslatedName(translated);
                    localRepo.save(entity);
                    // ✅ reindex في ES
                    ofacImportService.indexLocalToElastic(entity);
                    count++;
                } else {
                    skipped++;
                }
            } catch (Exception e) {
                log.warn("⚠️ Failed translation for local [{}]: {}", entity.getId(), e.getMessage());
            }
        }

        log.info("✅ Local translations done — Updated: {} | Skipped: {}", count, skipped);
    }

    // ── Global Sanctions ──
    @Transactional
    public void translateGlobal() {
        List<SanctionEntity> globals = globalRepo.findAll();
        int count = 0, skipped = 0;

        for (SanctionEntity entity : globals) {
            try {
                if (entity.getName() == null || entity.getName().isBlank()) continue;

                if (needsTranslation(entity.getName(), entity.getTranslatedName())) {
                    String translated = buildTranslation(entity.getName());
                    entity.setTranslatedName(translated);
                    globalRepo.save(entity);
                    // ✅ reindex في ES
                    ofacImportService.indexToElastic(entity);
                    count++;
                } else {
                    skipped++;
                }
            } catch (Exception e) {
                log.warn("⚠️ Failed translation for global [{}]: {}", entity.getId(), e.getMessage());
            }
        }

        log.info("✅ Global translations done — Updated: {} | Skipped: {}", count, skipped);
    }

    // ══════════════════════════════════════════
    //  needsTranslation
    //  true لو:
    //  - ما في translatedName
    //  - الـ translatedName = نفس الاسم العربي (ما اتترجم)
    //  - الـ translatedName فاضي
    // ══════════════════════════════════════════
    private boolean needsTranslation(String name, String translatedName) {
        if (translatedName == null || translatedName.isBlank()) return true;
        if (translatedName.equals(name)) return true;
        // لو الترجمة عربية أيضاً (ما اتترجمت فعلاً)
        if (SmartNameMatcher.isArabic(translatedName)) return true;
        return false;
    }

    // ══════════════════════════════════════════
    //  buildTranslation
    //  عربي → transliterate
    //  إنجليزي → كما هو
    // ══════════════════════════════════════════
    private String buildTranslation(String name) {
        if (SmartNameMatcher.isArabic(name)) {
            return SmartNameMatcher.transliterate(name);
        }
        return name.trim();
    }
}