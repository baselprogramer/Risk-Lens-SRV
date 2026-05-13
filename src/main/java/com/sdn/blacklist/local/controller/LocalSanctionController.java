package com.sdn.blacklist.local.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.sdn.blacklist.config.ApiVersion;
import com.sdn.blacklist.local.entity.LocalSanctionEntity;
import com.sdn.blacklist.local.service.LocalSanctionService;

import io.swagger.v3.oas.annotations.tags.Tag;

@CrossOrigin(origins ={ "https://risk-lens.net" , "https://api.risk-lens.net"})
@RestController
@RequestMapping(ApiVersion.V1 +"/local-sanctions")
@Tag(name = "Local Sanctions", description = "إدارة القائمة المحلية للعقوبات")
public class LocalSanctionController {

    private final LocalSanctionService service;
    
    public LocalSanctionController(LocalSanctionService service) {
        this.service = service;
    }


   @PostMapping("/import")
public ResponseEntity<?> importExcel(@RequestParam("file") MultipartFile file) {
    try {
        int saved = service.importFromExcel(file);
        return ResponseEntity.ok(Map.of("saved", saved));
    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(500)
                .body(Map.of("error", "فشل الاستيراد", 
                             "message", e.getMessage()));
    }
}
    @GetMapping
    public ResponseEntity<List<LocalSanctionEntity>> getAll() {
        List<LocalSanctionEntity> sanctions = service.findAll();
        return ResponseEntity.ok(sanctions);
    }

  @GetMapping("/{id}")
public ResponseEntity<Object> getById(@PathVariable UUID id) {
    return service.findById(id)
            .map(entity -> ResponseEntity.ok((Object) entity))
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Sanction not found with id: " + id));
}

    @PostMapping
    public ResponseEntity<?> create(@RequestBody LocalSanctionEntity entity) {
        try {
            LocalSanctionEntity created = service.create(entity);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating sanction: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable UUID id,
            @RequestBody LocalSanctionEntity entity) {
        try {
            LocalSanctionEntity updated = service.update(id, entity);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating sanction: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable UUID id) {
        try {
            service.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting sanction: " + e.getMessage());
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(@RequestParam String q) {
        try {
            if (q == null || q.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Search query cannot be empty");
            }
            List<LocalSanctionEntity> results = service.search(q);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error searching: " + e.getMessage());
        }
    }



    @GetMapping("/stats/count")
    public ResponseEntity<Long> getCount() {
        return ResponseEntity.ok(service.getTotalCount());
    }

    @GetMapping("/check-duplicate")
    public ResponseEntity<?> checkDuplicate(@RequestParam String name) {
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Name cannot be empty");
        }
        boolean isDuplicate = service.isDuplicate(name);
        return ResponseEntity.ok(isDuplicate);
    }
}