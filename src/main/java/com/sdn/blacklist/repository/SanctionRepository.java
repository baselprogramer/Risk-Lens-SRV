package com.sdn.blacklist.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.sdn.blacklist.entity.SanctionEntity;

@Repository
public interface SanctionRepository extends JpaRepository<SanctionEntity, UUID> {

    

    // ==== OFAC ====
    Optional<SanctionEntity> findByOfacUid(Long ofacUid);

   

    // ==== التحقق إذا موجود حسب الاسم والمصدر (للتحديث أو الاستيراد) ====
    boolean existsByNameAndSource(String name, String source);
    
    // ==== البحث بالـ ID في jsonb (OFAC/EU/UN إذا فيه ids) ====
    @Query(value = """
        SELECT DISTINCT s.*
        FROM sanction s
        LEFT JOIN jsonb_array_elements(s.ids) AS id_elem(id_json) ON true
        WHERE regexp_replace(id_elem.id_json ->> 'idNumber', '[^0-9]', '', 'g') = :q
    """, nativeQuery = true)
    List<SanctionEntity> searchByExactId(@Param("q") String q);

    // ==== البحث بالاسم أو aliases ====
    @Query(value = """
        SELECT DISTINCT s.*
        FROM sanction s
        LEFT JOIN jsonb_array_elements(s.aliases) AS a(alias_json) ON true
        WHERE
        (
            (SELECT count(*) FROM unnest(string_to_array(lower(:q), ' ')) AS word
             WHERE length(word) > 2
               AND lower(s.name) LIKE '%' || word || '%') =
            (SELECT count(*) FROM unnest(string_to_array(lower(:q), ' ')) AS word
             WHERE length(word) > 2)
        )
        OR
        (
            (SELECT count(*) FROM unnest(string_to_array(lower(:q), ' ')) AS word
             WHERE length(word) > 2
               AND lower(a.alias_json ->> 'lastName') LIKE '%' || word || '%') =
            (SELECT count(*) FROM unnest(string_to_array(lower(:q), ' ')) AS word
             WHERE length(word) > 2)
        )
    """, nativeQuery = true)
    List<SanctionEntity> searchByNameAndAlias(@Param("q") String q);

    @Transactional
    @Modifying
    @Query("UPDATE SanctionEntity s SET s.active = false WHERE s.source = 'OFAC' AND s.ofacUid NOT IN :uids")
    void deactivateMissingOfac(@Param("uids") List<Long> uids);

    Optional<SanctionEntity> findByExternalIdAndSource(String externalId, String source);
    boolean existsByExternalIdAndSource(String externalId, String source);

    List<SanctionEntity> findBySource(String source);

    // عد حسب المصدر
long countBySource(String source);

List<SanctionEntity> findAllByOrderByNameAsc();

 
// احذف حسب المصدر (قبل الـ sync)
@Transactional
@Modifying
@Query("DELETE FROM SanctionEntity s WHERE s.source = :source")
void deleteBySource(@Param("source") String source);
    

@Transactional
@Modifying
@Query("UPDATE SanctionEntity s SET s.active = false " +
       "WHERE s.source = 'INTERPOL' " +
       "AND s.externalId NOT IN :ids")
int deactivateMissingInterpol(@Param("ids") List<String> ids);

@Transactional
@Modifying
@Query("UPDATE SanctionEntity s SET s.active = false " +
       "WHERE s.source = :source " +
       "AND s.externalId NOT IN :ids")
int deactivateMissingBySource(@Param("source") String source,
                               @Param("ids") List<String> ids);


List<SanctionEntity> findBySourceAndActive(String source, Boolean active);
long countBySourceAndActive(String source, Boolean active);

List<SanctionEntity> findByActiveTrue();

Optional<SanctionEntity> findByOfacUidAndSource(Long ofacUid, String source);


@Transactional
@Modifying
@Query("UPDATE SanctionEntity s SET s.active = false " +
       "WHERE s.source = 'UN' AND s.ofacUid NOT IN :uids")
void deactivateMissingUn(@Param("uids") List<Long> uids);

@Transactional
@Modifying
@Query("UPDATE SanctionEntity s SET s.active = false " +
       "WHERE s.source = 'EU' AND s.ofacUid NOT IN :uids")
void deactivateMissingEu(@Param("uids") List<Long> uids);

}
