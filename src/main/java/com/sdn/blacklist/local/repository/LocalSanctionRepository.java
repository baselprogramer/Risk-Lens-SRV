package com.sdn.blacklist.local.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.sdn.blacklist.local.entity.LocalSanctionEntity;

public interface LocalSanctionRepository
        extends JpaRepository<LocalSanctionEntity, UUID> {


            @Query(value = """
            SELECT DISTINCT ls.*
            FROM local_sanction ls
            LEFT JOIN jsonb_array_elements(ls.aliases) a ON true
            WHERE
            lower(ls.name) LIKE '%' || :q || '%'
            OR lower(a ->> 'lastName') LIKE '%' || :q || '%'
            """, nativeQuery = true)
            List<LocalSanctionEntity> searchByName(@Param("q") String q);
            boolean existsByNameIgnoreCase(String name);


}
