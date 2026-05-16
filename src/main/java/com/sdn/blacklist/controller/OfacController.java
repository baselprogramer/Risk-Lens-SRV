package com.sdn.blacklist.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sdn.blacklist.config.ApiVersion;
import com.sdn.blacklist.dto.ImportResult;
import com.sdn.blacklist.entity.SanctionEntity;
import com.sdn.blacklist.repository.SanctionRepository;
import com.sdn.blacklist.response.ImportResponse;
import com.sdn.blacklist.service.EuImportService;
import com.sdn.blacklist.service.OfacImportService;
import com.sdn.blacklist.service.SanctionTranslationService;
import com.sdn.blacklist.service.UkImportService;
import com.sdn.blacklist.service.UnImportService;

import io.swagger.v3.oas.annotations.tags.Tag;


@CrossOrigin(origins = {"https://risk-lens.net" , "https://api.risk-lens.net"})

@RestController
@RequestMapping(ApiVersion.V1 + "/ofac")
@Tag(name = "Sanctions Import", description = "استيراد قوائم OFAC, EU, UN, UK")

public class OfacController {

    private final OfacImportService ofacImportService;
    private final EuImportService euImportService;
    private final SanctionTranslationService sanctionTranslationService;
    private final SanctionRepository sanctionRepository;
    

    public OfacController(OfacImportService ofacImportService ,
                            EuImportService euImportService ,
                            SanctionTranslationService sanctionTranslationService ,
                            SanctionRepository sanctionRepository) {
        this.ofacImportService = ofacImportService;
         this.euImportService = euImportService;
         this.sanctionTranslationService= sanctionTranslationService ;
         this.sanctionRepository= sanctionRepository ;                           
    }

    @GetMapping("/search")
    public List<SanctionEntity> search(@RequestParam String q) {
        return ofacImportService.search(q);
    }

    @PostMapping("/update-translations")
public ResponseEntity<String> updateTranslations() {
    sanctionTranslationService.generateTranslationsForAll();
    return ResponseEntity.ok("Translations updated!");
}


    @PostMapping("/import")
    public ImportResponse importOfac() throws Exception {

        ImportResult result = ofacImportService.importOfac();

        return new ImportResponse(
            true,
            "OFAC",
            result.getTotalEntries(),
            result.getSavedRecords(),
            "OFAC data imported successfully"
        );
    }

     @PostMapping("/sync")
    public String sync() throws Exception {
        ofacImportService.importOfac();
        return "OFAC Sync Completed";
    }

     @PostMapping("/import/eu")
    public ImportResponse importEu() throws Exception {

        ImportResult result = (ImportResult) euImportService.importEu();

        return new ImportResponse(
            true,
            "EU",
            result.getTotalEntries(),
            result.getSavedRecords(),
            "EU data imported successfully"
        );
}

// GET كل السجلات مع فلتر اختياري بالـ source
@GetMapping("/list")
public ResponseEntity<List<SanctionEntity>> getList(
        @RequestParam(required = false) String source) {

    List<SanctionEntity> result;

    if (source != null && !source.isBlank()) {
        result = sanctionRepository.findBySource(source.toUpperCase());
    } else {
        result = sanctionRepository.findAllByOrderByNameAsc();
    }

    return ResponseEntity.ok(result);
}

@RestController
@RequestMapping(ApiVersion.V1 + "/un")
@Tag(name = "UN", description = "استيراد قائمة الأمم المتحدة")

public class UnImportController {

 private final UnImportService unImportService;
         public UnImportController(UnImportService unImportService) {
        this.unImportService = unImportService;
    }
    @PostMapping("/import")
    public ResponseEntity<?> importUnData() {
        try {

            ImportResult result = unImportService.importUn();

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error importing UN data: " + e.getMessage());
        }
    }
}

@RestController
@RequestMapping(ApiVersion.V1 + "/uk")
@Tag(name = "UK", description = "استيراد قائمة المملكة المتحدة")

public class UkImportController {

    private final UkImportService ukImportService;

    public UkImportController(UkImportService ukImportService) {
        this.ukImportService = ukImportService;
    }

    @PostMapping("/import")
    public ResponseEntity<?> importUkData() {

        try {

            ImportResult result = ukImportService.importUk();

            return ResponseEntity.ok(result);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error importing UK data: " + e.getMessage());
        }
    }
}




}
