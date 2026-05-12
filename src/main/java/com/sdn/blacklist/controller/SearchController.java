package com.sdn.blacklist.controller;

import java.util.Collections;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sdn.blacklist.common.dto.SanctionSearchResult;
import com.sdn.blacklist.common.service.SanctionSearchService;
import com.sdn.blacklist.config.ApiVersion;
import com.sdn.blacklist.service.OfacImportService;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(ApiVersion.V1 + "/elastic")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
@Tag(name = "Search", description = "البحث في قوائم العقوبات عبر Elasticsearch")
public class SearchController {

    private final SanctionSearchService sanctionSearchService; // ← بدّل هون
    private final OfacImportService ofacImportService;

    @GetMapping("/elastic-search")
    public List<SanctionSearchResult> search(
            @RequestParam(required = false, defaultValue = "") String name,
            @RequestParam(required = false, defaultValue = "65.0") double threshold,
            @RequestParam(required = false, defaultValue = "0")  int page,
            @RequestParam(required = false, defaultValue = "20") int size) {

        if (name.isBlank()) return Collections.emptyList();

        return sanctionSearchService.search(name, threshold, page, size);
    }

    @PostMapping("/reindex")
    public ResponseEntity<String> reindex() {
        ofacImportService.reindexAll();
        return ResponseEntity.ok("Reindex done!");
    }

    @PostMapping("/reindex-local")
    public ResponseEntity<String> reindexLocal() {
        ofacImportService.reindexLocal();
        return ResponseEntity.ok("Local reindex done!");
    }
}