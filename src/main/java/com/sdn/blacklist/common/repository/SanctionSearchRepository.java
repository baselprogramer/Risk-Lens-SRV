package com.sdn.blacklist.common.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.sdn.blacklist.local.entity.LocalSanctionEntity;


@Repository
public interface SanctionSearchRepository extends JpaRepository<LocalSanctionEntity, UUID> {

@Query(value = """
WITH query_tokens AS (
    SELECT regexp_replace(lower(immutable_unaccent(token)), '[- ]', '', 'g') AS token
    FROM unnest(string_to_array(:query, ' ')) AS token
    WHERE length(token) > 1
),

candidate_tokens AS (
    SELECT DISTINCT t.id
    FROM mv_sanction_tokens t
    JOIN query_tokens q ON (
        similarity(q.token, t.token) > 0.3
        OR t.token = q.token
        OR t.token LIKE q.token || '%'
    )
),

token_scores AS (
    SELECT 
        t.id,
        t.name,
        t.translated_name,
        t.source,
        t.all_aliases,
        q.token AS query_token,
    MAX(
    (
        0.15 * similarity(q.token, t.token) +   -- قللنا من 0.20 إلى 0.15
        0.35 * CASE 
            WHEN dmetaphone(q.token) = dmetaphone(t.token) THEN 1.0
            WHEN dmetaphone_alt(q.token) = dmetaphone(t.token) THEN 0.8 -- رفعنا من 0.7 إلى 0.8
            ELSE 0.0 
        END +
        0.30 * (1.0 - LEAST(levenshtein(q.token, t.token), 10)::float / 
                GREATEST(length(q.token), length(t.token), 1)) +  -- رفعنا من 0.25 إلى 0.30
        0.10 * CASE WHEN q.token = t.token THEN 1 ELSE 0 END +
        0.10 * CASE WHEN t.token LIKE q.token || '%' THEN 1 ELSE 0 END  -- رفعنا من 0.05 إلى 0.10
    ) *
    CASE 
        WHEN t.frequency > 100 THEN 0.70
        WHEN t.frequency > 50  THEN 0.85
        WHEN t.frequency > 20  THEN 0.95
        ELSE 1.0
    END

        ) AS best_score
    FROM query_tokens q
    JOIN mv_sanction_tokens t ON t.id IN (SELECT id FROM candidate_tokens)
    GROUP BY t.id, t.name, t.translated_name, t.source, t.all_aliases, q.token
),

aggregated AS (
    SELECT
        id, name, translated_name, source, all_aliases,
        AVG(best_score) AS token_score,
        COUNT(DISTINCT query_token) AS matched_tokens,
        (SELECT COUNT(*) FROM query_tokens) AS total_query_tokens
    FROM token_scores
    GROUP BY id, name, translated_name, source, all_aliases
)

SELECT
    id,
    name,
    translated_name,
    CASE 
        WHEN similarity(name, lower(immutable_unaccent(:query))) > 0.90 
          OR similarity(translated_name, lower(immutable_unaccent(:query))) > 0.90
        THEN LEAST(token_score * 1.2, 1.0)
        ELSE token_score
    END AS score,
    source,
    similarity(name, lower(immutable_unaccent(:query))) AS nameSimilarity,
    COALESCE(similarity(coalesce(all_aliases,''), lower(immutable_unaccent(:query))), 0.0) AS aliasSimilarity
FROM aggregated
WHERE 
    token_score > :threshold
    AND (matched_tokens::float / NULLIF(total_query_tokens, 0)) >= 0.7
ORDER BY score DESC
LIMIT :limit
OFFSET :offset;
""", nativeQuery = true)
List<Object[]> searchAll(
    @Param("query") String query,
    @Param("threshold") double threshold,
    @Param("limit") int limit,
    @Param("offset") int offset
);

@Modifying
@Query(value = "REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sanction_tokens", nativeQuery = true)
void refreshMaterializedView();

}
