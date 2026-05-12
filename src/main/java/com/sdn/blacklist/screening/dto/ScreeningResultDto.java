package com.sdn.blacklist.screening.dto;

import com.sdn.blacklist.screening.model.ScreeningResult;

import java.util.List;
import java.util.stream.Collectors;

public class ScreeningResultDto {

    private Long id;
    private String riskLevel;
    private String status;
    private List<ScreeningMatchDto> matches;

    public ScreeningResultDto(ScreeningResult r) {
        this.id = r.getId();
        this.riskLevel = r.getRiskLevel().name();
        this.status = r.getStatus().name();
        this.matches = r.getMatches()
                .stream()
                .map(ScreeningMatchDto::new)
                .collect(Collectors.toList());
    }

    public Long getId() { return id; }
    public String getRiskLevel() { return riskLevel; }
    public String getStatus() { return status; }
    public List<ScreeningMatchDto> getMatches() { return matches; }
}