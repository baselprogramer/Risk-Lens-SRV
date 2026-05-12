package com.sdn.blacklist.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sdn.blacklist.common.util.NameTranslator;
import com.sdn.blacklist.entity.SanctionEntity;
import com.sdn.blacklist.local.entity.LocalSanctionEntity;
import com.sdn.blacklist.local.repository.LocalSanctionRepository;
import com.sdn.blacklist.repository.SanctionRepository;

@Service
public class SanctionTranslationService {

    private final LocalSanctionRepository localRepo;
    private final SanctionRepository globalRepo;

    public SanctionTranslationService(LocalSanctionRepository localRepo,
                                      SanctionRepository globalRepo) {
        this.localRepo = localRepo;
        this.globalRepo = globalRepo;
    }

    @Transactional
    public void generateTranslationsForAll() {
        // =================== القوائم المحلية ===================
        List<LocalSanctionEntity> locals = localRepo.findAll();
        for (LocalSanctionEntity entity : locals) {
            if (entity.getName() != null && !entity.getName().isBlank()) {
                entity.setTranslatedName(NameTranslator.translateName(entity.getName()));
                localRepo.save(entity);
            }
        }

        // =================== القوائم العالمية ===================
        List<SanctionEntity> globals = globalRepo.findAll();
        for (SanctionEntity entity : globals) {
            if (entity.getName() != null && !entity.getName().isBlank()) {
                entity.setTranslatedName(NameTranslator.translateName(entity.getName()));
                globalRepo.save(entity);
            }
        }
    }
}