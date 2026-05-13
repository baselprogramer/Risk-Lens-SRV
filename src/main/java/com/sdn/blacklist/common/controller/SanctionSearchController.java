package com.sdn.blacklist.common.controller;



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
@CrossOrigin(origins = {"https://risk-lens.net" , "https://api.risk-lens.net"}) 
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
        @RequestParam(defaultValue = "0.7") double threshold,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "5") int size) {

    return service.search(q, threshold, page, size);
}

@GetMapping("/details")
public Object getDetails(
        @RequestParam UUID id,
        @RequestParam String source) {

    return service.getDetails(id, source);
}

}


