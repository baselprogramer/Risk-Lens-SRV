package com.sdn.blacklist.local.service;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.sdn.blacklist.common.util.NameTranslator;
import com.sdn.blacklist.common.util.SmartNameMatcher;
import com.sdn.blacklist.local.entity.LocalSanctionEntity;
import com.sdn.blacklist.local.repository.LocalSanctionRepository;
import com.sdn.blacklist.service.OfacImportService;

@Service
@Transactional
public class LocalSanctionService {

    private final LocalSanctionRepository repository;
    private final OfacImportService ofacImportService;

    public LocalSanctionService(LocalSanctionRepository repository,
            OfacImportService ofacImportService) {
        this.repository = repository;
        this.ofacImportService = ofacImportService;
    }

    // ══════════════════════════════════════════
    // CREATE — index بعد الحفظ
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
        System.out.println(">>> TRANSLATED: " + entity.getTranslatedName());

        LocalSanctionEntity saved = repository.save(entity);

        try {
            ofacImportService.indexLocalToElastic(saved);
        } catch (Exception e) {
            System.err.println("⚠️ ES index failed for local entity: " + e.getMessage());
        }

        return saved;
    }

    // ══════════════════════════════════════════
    // UPDATE — index بعد التحديث
    // ══════════════════════════════════════════
    public LocalSanctionEntity update(UUID id, LocalSanctionEntity updated) {
        LocalSanctionEntity existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sanction not found with id: " + id));

        if (updated.getName() != null && !updated.getName().trim().isEmpty()) {
            existing.setName(updated.getName().trim());
            existing.setTranslatedName(NameTranslator.translateNameViaApi(updated.getName()));
        }
        if (updated.getAliases() != null)
            existing.setAliases(updated.getAliases());
        if (updated.getDateOfBirth() != null)
            existing.setDateOfBirth(updated.getDateOfBirth());
        if (updated.getNationality() != null)
            existing.setNationality(updated.getNationality());
        if (updated.getRequestedBy() != null)
            existing.setRequestedBy(updated.getRequestedBy());
        if (updated.getNote() != null)
            existing.setNote(updated.getNote());
        if (updated.getMotherName() != null)
            existing.setMotherName(updated.getMotherName());
        if (updated.getIdNumber() != null)
            existing.setIdNumber(updated.getIdNumber());
        if (updated.getIssuingAuthority() != null)
            existing.setIssuingAuthority(updated.getIssuingAuthority());
        if (updated.getAdditionalInfo() != null)
            existing.setAdditionalInfo(updated.getAdditionalInfo());
        if (updated.getEntityType() != null)
            existing.setEntityType(updated.getEntityType());
        if (updated.getCommercialRegNo() != null)
            existing.setCommercialRegNo(updated.getCommercialRegNo());
        if (updated.getRecordType() != null)
            existing.setRecordType(updated.getRecordType());

        existing.setUpdatedAt(LocalDateTime.now());

        LocalSanctionEntity saved = repository.save(existing);

        try {
            ofacImportService.indexLocalToElastic(saved);
        } catch (Exception e) {
            System.err.println("⚠️ ES re-index failed for local entity: " + e.getMessage());
        }

        return saved;
    }

    // ══════════════════════════════════════════
    // DELETE — احذف من ES كمان
    // ══════════════════════════════════════════
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Sanction not found with id: " + id);
        }
        repository.deleteById(id);

        try {
            ofacImportService.deleteFromElastic(id.toString());
        } catch (Exception e) {
            System.err.println("⚠️ ES delete failed for local entity: " + e.getMessage());
        }
    }

    @Transactional(noRollbackFor = Exception.class)
    public int importFromExcel(MultipartFile file) throws Exception {
        int savedCount = 0;
        List<String> namesInFile = new ArrayList<>(); // ← جديد

        try (InputStream is = file.getInputStream();
                Workbook workbook = WorkbookFactory.create(is)) {

            for (int i = 0; i < workbook.getNumberOfSheets(); i++) {

                org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheetAt(i);
                String sheetName = sheet.getSheetName();

                Iterator<Row> rowIterator = sheet.iterator();
                if (rowIterator.hasNext())
                    rowIterator.next();

                while (rowIterator.hasNext()) {
                    Row row = rowIterator.next();
                    try {
                        LocalSanctionEntity entity = sheetName.contains("كيان") || sheetName.contains("جمعيات")
                                ? mapEntityRow(row)
                                : mapIndividualRow(row);

                        if (entity == null)
                            continue;

                        namesInFile.add(entity.getName());

                        if (!repository.existsByNameIgnoreCase(entity.getName())) {
                            try {
                                String translated = NameTranslator.translateNameViaApi(entity.getName());
                                entity.setTranslatedName(translated != null ? translated
                                        : SmartNameMatcher.transliterate(entity.getName()));
                            } catch (Exception e) {
                                entity.setTranslatedName(SmartNameMatcher.transliterate(entity.getName()));
                            }
                            try {
                                Thread.sleep(300);
                            } catch (Exception ignored) {
                            }

                            LocalSanctionEntity saved = repository.save(entity);
                            try {
                                ofacImportService.indexLocalToElastic(saved);
                            } catch (Exception e) {
                                System.err.println("⚠️ ES index failed: " + e.getMessage());
                            }
                            savedCount++;
                        }
                    } catch (Exception rowEx) {
                        System.err.println("⚠️ Skipping row: " + rowEx.getMessage());
                    }
                }
            }
        }

        if (!namesInFile.isEmpty()) {
            repository.deactivateMissingLocal(namesInFile);
        }

        return savedCount;
    }

    // ══════════════════════════════════════════
    // QUERIES
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
    // EXCEL MAPPERS
    // ══════════════════════════════════════════

    private LocalSanctionEntity mapEntityRow(Row row) {
        try {
            Cell nameCell = row.getCell(0);
            if (nameCell == null || nameCell.toString().isBlank())
                return null;

            LocalSanctionEntity entity = new LocalSanctionEntity();
            entity.setRecordType("ENTITY");
            entity.setActive(true); // ← جديد
            entity.setName(nameCell.toString().trim());

            Cell authCell = row.getCell(1);
            if (authCell != null && !authCell.toString().isBlank())
                entity.setIssuingAuthority(authCell.toString().trim());

            Cell typeCell = row.getCell(2);
            if (typeCell != null && !typeCell.toString().isBlank())
                entity.setEntityType(typeCell.toString().trim());

            Cell regCell = row.getCell(3);
            if (regCell != null && !regCell.toString().isBlank())
                entity.setCommercialRegNo(regCell.toString().trim());

            entity.setCreatedAt(LocalDateTime.now());
            return entity;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    private LocalSanctionEntity mapIndividualRow(Row row) {
        try {
            Cell nameCell = row.getCell(0);
            if (nameCell == null || nameCell.toString().isBlank())
                return null;

            LocalSanctionEntity entity = new LocalSanctionEntity();
            entity.setRecordType("PERSON");
            entity.setActive(true); // ← جديد
            entity.setName(nameCell.toString().trim());

            Cell motherCell = row.getCell(1);
            if (motherCell != null && !motherCell.toString().isBlank())
                entity.setMotherName(motherCell.toString().trim());

            Cell nationalityCell = row.getCell(2);
            if (nationalityCell != null && !nationalityCell.toString().isBlank())
                entity.setNationality(nationalityCell.toString().trim());

            Cell dobCell = row.getCell(3);
            if (dobCell != null && !dobCell.toString().isBlank()) {
                try {
                    if (dobCell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(dobCell)) {
                        entity.setDateOfBirth(dobCell.getLocalDateTimeCellValue().toLocalDate());
                    } else {
                        entity.setDateOfBirth(java.time.LocalDate.parse(dobCell.toString().trim()));
                    }
                } catch (Exception ignored) {
                }
            }

            Cell idCell = row.getCell(4);
            if (idCell != null && !idCell.toString().isBlank())
                entity.setIdNumber(idCell.toString().trim());

            Cell authCell = row.getCell(5);
            if (authCell != null && !authCell.toString().isBlank())
                entity.setIssuingAuthority(authCell.toString().trim());

            Cell extraCell = row.getCell(6);
            if (extraCell != null && !extraCell.toString().isBlank())
                entity.setAdditionalInfo(extraCell.toString().trim());

            entity.setCreatedAt(LocalDateTime.now());
            return entity;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}