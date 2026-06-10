package com.sdn.blacklist.common.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sdn.blacklist.common.dto.SanctionSearchResult;
import com.sdn.blacklist.common.service.SanctionSearchService;
import com.sdn.blacklist.config.ApiVersion;

import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping(ApiVersion.V1 + "/search")
@CrossOrigin(origins = { "https://risk-lens.net", "https://api.risk-lens.net" })
@Tag(name = "Search", description = "البحث في قوائم العقوبات")
public class SanctionSearchController {

    private final SanctionSearchService service;

    public SanctionSearchController(SanctionSearchService service) {
        this.service = service;
    }

    // البحث
    @GetMapping
    public List<SanctionSearchResult> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "70.0") double threshold,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        return service.search(q, threshold, page, size);
    }

    // تفاصيل وثيقة وحدة
    @GetMapping("/details")
    public Object getDetails(
            @RequestParam UUID id,
            @RequestParam String source) {

        return service.getDetails(id, source);
    }

    // تفاصيل مجمّعة — id لكل مصدر بطلبة وحدة

    @GetMapping("/details/batch")
    public List<Object> getDetailsBatch(
            @RequestParam List<UUID> ids,
            @RequestParam List<String> sources) {

        List<Object> out = new ArrayList<>();
        for (int i = 0; i < ids.size(); i++) {
            String src = (i < sources.size()) ? sources.get(i) : null;
            try {
                out.add(service.getDetails(ids.get(i), src));
            } catch (Exception e) {
                out.add(null);
            }
        }
        return out;
    }
}