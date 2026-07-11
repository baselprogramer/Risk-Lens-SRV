package com.sdn.blacklist.internallist.service;

import java.io.InputStream;
import java.time.LocalDate;
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
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.sdn.blacklist.common.util.NameTranslator;
import com.sdn.blacklist.common.util.SmartNameMatcher;
import com.sdn.blacklist.internallist.entity.InternalListEntity;
import com.sdn.blacklist.internallist.repository.InternalListRepository;
import com.sdn.blacklist.service.OfacImportService;

@Service
@Transactional
public class InternalListService {

    private final InternalListRepository repository;
    private final OfacImportService ofacImportService;

    public InternalListService(InternalListRepository repository,
                               OfacImportService ofacImportService) {
        this.repository = repository;
        this.ofacImportService = ofacImportService;
    }

    // ══════════════════════════════════════════
    // CREATE
    // ══════════════════════════════════════════
    public InternalListEntity create(InternalListEntity entity, Long tenantId) {
        if (tenantId == null) throw new IllegalArgumentException("Tenant context missing");
        if (entity.getName() == null || entity.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Name is required");
        }

        entity.setTenantId(tenantId);              // ← دائماً من الـ JWT
        entity.setName(entity.getName().trim());
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(null);
        entity.setTranslatedName(NameTranslator.translateNameViaApi(entity.getName()));

        InternalListEntity saved = repository.save(entity);

        try {
            ofacImportService.indexInternalToElastic(saved);
        } catch (Exception e) {
            System.err.println("⚠️ ES index failed for internal entity: " + e.getMessage());
        }

        return saved;
    }

    // ══════════════════════════════════════════
    // UPDATE — بس لو السجل تبع نفس الشركة
    // ══════════════════════════════════════════
    public InternalListEntity update(UUID id, InternalListEntity updated, Long tenantId) {
        InternalListEntity existing = repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new RuntimeException("Record not found: " + id));

        if (updated.getName() != null && !updated.getName().trim().isEmpty()) {
            existing.setName(updated.getName().trim());
            existing.setTranslatedName(NameTranslator.translateNameViaApi(updated.getName()));
        }
        if (updated.getAliases() != null)          existing.setAliases(updated.getAliases());
        if (updated.getDateOfBirth() != null)      existing.setDateOfBirth(updated.getDateOfBirth());
        if (updated.getNationality() != null)      existing.setNationality(updated.getNationality());
        if (updated.getRequestedBy() != null)      existing.setRequestedBy(updated.getRequestedBy());
        if (updated.getNote() != null)             existing.setNote(updated.getNote());
        if (updated.getMotherName() != null)       existing.setMotherName(updated.getMotherName());
        if (updated.getIdNumber() != null)         existing.setIdNumber(updated.getIdNumber());
        if (updated.getIssuingAuthority() != null) existing.setIssuingAuthority(updated.getIssuingAuthority());
        if (updated.getAdditionalInfo() != null)   existing.setAdditionalInfo(updated.getAdditionalInfo());
        if (updated.getEntityType() != null)       existing.setEntityType(updated.getEntityType());
        if (updated.getCommercialRegNo() != null)  existing.setCommercialRegNo(updated.getCommercialRegNo());
        if (updated.getRecordType() != null)       existing.setRecordType(updated.getRecordType());
        if (updated.getActive() != null)           existing.setActive(updated.getActive());

        existing.setUpdatedAt(LocalDateTime.now());

        InternalListEntity saved = repository.save(existing);

        try {
            ofacImportService.indexInternalToElastic(saved);
        } catch (Exception e) {
            System.err.println("⚠️ ES re-index failed for internal entity: " + e.getMessage());
        }

        return saved;
    }

    // ══════════════════════════════════════════
    // DELETE — بس لو السجل تبع نفس الشركة
    // ══════════════════════════════════════════
    public void delete(UUID id, Long tenantId) {
        if (!repository.existsByIdAndTenantId(id, tenantId)) {
            throw new RuntimeException("Record not found: " + id);
        }
        repository.deleteById(id);

        try {
            ofacImportService.deleteFromElastic(id.toString());
        } catch (Exception e) {
            System.err.println("⚠️ ES delete failed for internal entity: " + e.getMessage());
        }
    }

    // ══════════════════════════════════════════
    // EXCEL IMPORT — نفس مابرز LocalSanction + tenant + ES
    // ══════════════════════════════════════════
    @Transactional(noRollbackFor = Exception.class)
    public int importFromExcel(MultipartFile file, Long tenantId) throws Exception {
        if (tenantId == null) throw new IllegalArgumentException("Tenant context missing");

        int savedCount = 0;
        List<String> namesInFile = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                Sheet sheet = workbook.getSheetAt(i);
                String sheetName = sheet.getSheetName();

                Iterator<Row> rowIterator = sheet.iterator();
                if (rowIterator.hasNext()) rowIterator.next();   // تخطّي الهيدر

                while (rowIterator.hasNext()) {
                    Row row = rowIterator.next();
                    try {
                        InternalListEntity entity =
                                (sheetName.contains("كيان") || sheetName.contains("جمعيات"))
                                        ? mapEntityRow(row)
                                        : mapIndividualRow(row);

                        if (entity == null) continue;

                        entity.setTenantId(tenantId);            // ← ربط بالشركة
                        namesInFile.add(entity.getName());

                        if (!repository.existsByTenantIdAndNameIgnoreCase(tenantId, entity.getName())) {
                            try {
                                String translated = NameTranslator.translateNameViaApi(entity.getName());
                                entity.setTranslatedName(translated != null ? translated
                                        : SmartNameMatcher.transliterate(entity.getName()));
                            } catch (Exception e) {
                                entity.setTranslatedName(SmartNameMatcher.transliterate(entity.getName()));
                            }
                            try { Thread.sleep(300); } catch (Exception ignored) {}

                            InternalListEntity saved = repository.save(entity);
                            try {
                                ofacImportService.indexInternalToElastic(saved);
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
            repository.deactivateMissingByTenant(tenantId, namesInFile);
        }

        return savedCount;
    }

    // ══════════════════════════════════════════
    // QUERIES — كلها scoped
    // ══════════════════════════════════════════
    public List<InternalListEntity> findAll(Long tenantId) {
        return repository.findByTenantId(tenantId);
    }

    public Optional<InternalListEntity> findById(UUID id, Long tenantId) {
        return repository.findByIdAndTenantId(id, tenantId);
    }

    public List<InternalListEntity> search(String q, Long tenantId) {
        if (q == null || q.trim().isEmpty()) {
            throw new IllegalArgumentException("Search query cannot be empty");
        }
        return repository.searchByNameAndTenant(q.toLowerCase().trim(), tenantId);
    }

    public boolean isDuplicate(String name, Long tenantId) {
        return repository.existsByTenantIdAndNameIgnoreCase(tenantId, name.trim());
    }

    public long getTotalCount(Long tenantId) {
        return repository.countByTenantId(tenantId);
    }

    // ══════════════════════════════════════════
    // EXCEL MAPPERS — نفس تنسيق LocalSanction
    // ══════════════════════════════════════════
    private InternalListEntity mapEntityRow(Row row) {
        try {
            Cell nameCell = row.getCell(0);
            if (nameCell == null || nameCell.toString().isBlank()) return null;

            InternalListEntity e = new InternalListEntity();
            e.setRecordType("ENTITY");
            e.setActive(true);
            e.setName(nameCell.toString().trim());

            Cell authCell = row.getCell(1);
            if (authCell != null && !authCell.toString().isBlank()) e.setIssuingAuthority(authCell.toString().trim());
            Cell typeCell = row.getCell(2);
            if (typeCell != null && !typeCell.toString().isBlank()) e.setEntityType(typeCell.toString().trim());
            Cell regCell = row.getCell(3);
            if (regCell != null && !regCell.toString().isBlank()) e.setCommercialRegNo(regCell.toString().trim());

            e.setCreatedAt(LocalDateTime.now());
            return e;
        } catch (Exception ex) { ex.printStackTrace(); return null; }
    }

    private InternalListEntity mapIndividualRow(Row row) {
        try {
            Cell nameCell = row.getCell(0);
            if (nameCell == null || nameCell.toString().isBlank()) return null;

            InternalListEntity e = new InternalListEntity();
            e.setRecordType("PERSON");
            e.setActive(true);
            e.setName(nameCell.toString().trim());

            Cell motherCell = row.getCell(1);
            if (motherCell != null && !motherCell.toString().isBlank()) e.setMotherName(motherCell.toString().trim());
            Cell nationalityCell = row.getCell(2);
            if (nationalityCell != null && !nationalityCell.toString().isBlank()) e.setNationality(nationalityCell.toString().trim());

            Cell dobCell = row.getCell(3);
            if (dobCell != null && !dobCell.toString().isBlank()) {
                try {
                    if (dobCell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(dobCell)) {
                        e.setDateOfBirth(dobCell.getLocalDateTimeCellValue().toLocalDate());
                    } else {
                        e.setDateOfBirth(LocalDate.parse(dobCell.toString().trim()));
                    }
                } catch (Exception ignored) {}
            }

            Cell idCell = row.getCell(4);
            if (idCell != null && !idCell.toString().isBlank()) e.setIdNumber(idCell.toString().trim());
            Cell authCell = row.getCell(5);
            if (authCell != null && !authCell.toString().isBlank()) e.setIssuingAuthority(authCell.toString().trim());
            Cell extraCell = row.getCell(6);
            if (extraCell != null && !extraCell.toString().isBlank()) e.setAdditionalInfo(extraCell.toString().trim());

            e.setCreatedAt(LocalDateTime.now());
            return e;
        } catch (Exception ex) { ex.printStackTrace(); return null; }
    }
}