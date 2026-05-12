package com.sdn.blacklist.screening.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sdn.blacklist.screening.model.ScreeningMatch;

@Repository
public interface ScreeningMatchRepository extends JpaRepository<ScreeningMatch, Long> {
}