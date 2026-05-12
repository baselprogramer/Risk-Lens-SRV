package com.sdn.blacklist.common.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sdn.blacklist.common.util.CountryRisk;

public interface CountryRiskRepository extends JpaRepository<CountryRisk, String> {}