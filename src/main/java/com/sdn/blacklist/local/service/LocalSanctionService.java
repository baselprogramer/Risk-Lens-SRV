package com.sdn.blacklist.local.service;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.sdn.blacklist.common.util.NameTranslator;
import com.sdn.blacklist.local.entity.LocalSanctionEntity;
import com.sdn.blacklist.local.repository.LocalSanctionRepository;
import com.sdn.blacklist.service.OfacImportService;

@Service
@Transactional
public class LocalSanctionService {

    private final LocalSanctionRepository repository;
    private final OfacImportService        ofacImportService;

    public LocalSanctionService(LocalSanctionRepository repository,
                                OfacImportService ofacImportService) {
        this.repository       = repository;
        this.ofacImportService = ofacImportService;
    }

    // ══════════════════════════════════════════
    //  CREATE —  index بعد الحفظ
    // ══════════════════════════════════════════
    public LocalSanctionEntity create(LocalSanctionEntity entity) {
        if (entity.getName() == null || entity.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Name is required");
        }

        entity.setName(entity.getName().trim());

        System.out.println(">>> NAME: " + entity.getName());
        System.out.println(">>> IS ARABIC: " + entity.getName().chars().anyMatch(c -> c >= 0x0600 && c <= 0x06FF));
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(null);
        entity.setTranslatedName(NameTranslator.translateNameViaApi(entity.getName()));
        System.out.println(">>> TRANSLATED: " + entity.getTranslatedName()); // ← أضف


        LocalSanctionEntity saved = repository.save(entity);

        //  فهرسة فورية في Elasticsearch
        try {
            ofacImportService.indexLocalToElastic(saved);
        } catch (Exception e) {
            System.err.println("⚠️ ES index failed for local entity: " + e.getMessage());
        }

        return saved;
        
    }

    // ══════════════════════════════════════════
    //  UPDATE —  index بعد التحديث
    // ══════════════════════════════════════════
    public LocalSanctionEntity update(UUID id, LocalSanctionEntity updated) {
        LocalSanctionEntity existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sanction not found with id: " + id));

        if (updated.getName() != null && !updated.getName().trim().isEmpty()) {
            existing.setName(updated.getName().trim());
            existing.setTranslatedName(NameTranslator.translateNameViaApi(updated.getName()));
        }
        if (updated.getAliases()     != null) existing.setAliases(updated.getAliases());
        if (updated.getDateOfBirth() != null) existing.setDateOfBirth(updated.getDateOfBirth());
        if (updated.getNationality() != null) existing.setNationality(updated.getNationality());
        if (updated.getRequestedBy() != null) existing.setRequestedBy(updated.getRequestedBy());
        if (updated.getNote()        != null) existing.setNote(updated.getNote());

        existing.setUpdatedAt(LocalDateTime.now());

        LocalSanctionEntity saved = repository.save(existing);

        //  تحديث الفهرسة في Elasticsearch
        try {
            ofacImportService.indexLocalToElastic(saved);
        } catch (Exception e) {
            System.err.println("⚠️ ES re-index failed for local entity: " + e.getMessage());
        }

        return saved;
    }

    // ══════════════════════════════════════════
    //  DELETE —  احذف من ES كمان
    // ══════════════════════════════════════════
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Sanction not found with id: " + id);
        }
        repository.deleteById(id);

        // احذف من Elasticsearch
        try {
            ofacImportService.deleteFromElastic(id.toString());
        } catch (Exception e) {
            System.err.println("⚠️ ES delete failed for local entity: " + e.getMessage());
        }
    }

    // ══════════════════════════════════════════
    //  IMPORT EXCEL —  index بعد كل حفظ
    // ══════════════════════════════════════════
  public int importFromExcel(MultipartFile file) throws Exception {
    int savedCount = 0;

    try (InputStream is = file.getInputStream();
         Workbook workbook = WorkbookFactory.create(is)) {

        for (int i = 0; i < workbook.getNumberOfSheets(); i++) {

            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(i);
            String sheetName = sheet.getSheetName();

            Iterator<Row> rowIterator = sheet.iterator();
            if (rowIterator.hasNext()) rowIterator.next();
            if (rowIterator.hasNext()) rowIterator.next();

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();

                LocalSanctionEntity entity = sheetName.contains("كيان") || sheetName.contains("جمعيات")
                        ? mapEntityRow(row)
                        : mapIndividualRow(row);

                if (entity != null && !repository.existsByNameIgnoreCase(entity.getName())) {
                    
                    // ترجمة مع delay
                    entity.setTranslatedName(NameTranslator.translateNameViaApi(entity.getName()));
                    try { Thread.sleep(300); } catch (Exception ignored) {}

                    LocalSanctionEntity saved = repository.save(entity);

                    try {
                        ofacImportService.indexLocalToElastic(saved);
                    } catch (Exception e) {
                        System.err.println("⚠️ ES index failed: " + e.getMessage());
                    }

                    savedCount++;
                }
            }
        }
    }

    return savedCount;
}

    // ══════════════════════════════════════════
    //  QUERIES
    // ══════════════════════════════════════════
    public List<LocalSanctionEntity> findAll() {
        return repository.findAll();
    }

    public Optional<LocalSanctionEntity> findById(UUID id) {
        return repository.findById(id);
    }

    public List<LocalSanctionEntity> search(String q) {
        if (q == null || q.trim().isEmpty()) {
            throw new IllegalArgumentException("Search query cannot be empty");
        }
        return repository.searchByName(q.toLowerCase().trim());
    }

    public boolean isDuplicate(String name) {
        return !repository.searchByName(name.toLowerCase().trim()).isEmpty();
    }

    public long getTotalCount() {
        return repository.count();
    }

    // ══════════════════════════════════════════
    //  EXCEL MAPPERS
    // ══════════════════════════════════════════
    private LocalSanctionEntity mapEntityRow(Row row) {
        try {
            Cell nameCell = row.getCell(1);
            if (nameCell == null || nameCell.toString().isBlank()) return null;

            LocalSanctionEntity entity = new LocalSanctionEntity();
            entity.setName(nameCell.toString().trim());

            Cell infoCell = row.getCell(2);
            if (infoCell != null) entity.setNote(infoCell.toString().trim());

            Cell reasonCell = row.getCell(3);
            if (reasonCell != null)
                entity.setNote((entity.getNote() != null ? entity.getNote() + " | " : "")
                        + reasonCell.toString().trim());

            entity.setCreatedAt(LocalDateTime.now());
            return entity;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    private LocalSanctionEntity mapIndividualRow(Row row) {
        try {
            Cell nameCell = row.getCell(1);
            if (nameCell == null || nameCell.toString().isBlank()) return null;

            LocalSanctionEntity entity = new LocalSanctionEntity();
            entity.setName(nameCell.toString().trim());

            Cell nationalityCell = row.getCell(3);
            if (nationalityCell != null) entity.setNationality(nationalityCell.toString().trim());

            String note = "";
            Cell reasonCell = row.getCell(5);
            if (reasonCell != null) note += reasonCell.toString().trim();

            Cell extraCell = row.getCell(6);
            if (extraCell != null) note += " | " + extraCell.toString().trim();

            entity.setNote(note);
            entity.setCreatedAt(LocalDateTime.now());
            return entity;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}