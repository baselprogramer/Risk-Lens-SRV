package com.sdn.blacklist.apikey.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.sdn.blacklist.apikey.entity.ApiKey;

public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {

    Optional<ApiKey> findByKeyHash(String keyHash);

    List<ApiKey> findAllByOrderByCreatedAtDesc();

    // آخر key فعّال للمشترك
    @Query("SELECT k FROM ApiKey k WHERE k.username = :username AND k.active = true ORDER BY k.createdAt DESC")
    Optional<ApiKey> findActiveByUsername(@Param("username") String username);

    // كل keys المشترك
    List<ApiKey> findByUsernameOrderByCreatedAtDesc(String username);

    @Modifying
    @Transactional
    @Query("UPDATE ApiKey k SET k.lastUsedAt = CURRENT_TIMESTAMP, k.requestCount = COALESCE(k.requestCount, 0) + 1 WHERE k.id = :id")
    void updateLastUsed(@Param("id") Long id);

    List<ApiKey> findByTenantIdOrderByCreatedAtDesc(Long tenantId);

}