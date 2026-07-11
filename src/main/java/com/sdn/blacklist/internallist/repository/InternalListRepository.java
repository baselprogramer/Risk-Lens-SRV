package com.sdn.blacklist.internallist.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.sdn.blacklist.internallist.entity.InternalListEntity;

public interface InternalListRepository
        extends JpaRepository<InternalListEntity, UUID> {

    // ══════════════════════════════════════════
    // كل الاستعلامات مقيّدة بالـ tenant — عزل تام بين الشركات
    // ══════════════════════════════════════════

    // getAll للشركة — سجلاتها هي فقط
    List<InternalListEntity> findByTenantId(Long tenantId);

    List<InternalListEntity> findByTenantIdAndActiveTrue(Long tenantId);

    // جلب/تعديل/حذف سجل واحد — لازم يكون تبع نفس الشركة
    Optional<InternalListEntity> findByIdAndTenantId(UUID id, Long tenantId);

    boolean existsByIdAndTenantId(UUID id, Long tenantId);

    // منع التكرار داخل الشركة فقط (مش عالمستوى الكلّي)
    boolean existsByTenantIdAndNameIgnoreCase(Long tenantId, String name);

    long countByTenantId(Long tenantId);

    // البحث بالاسم — scoped بالـ tenant
    @Query(value = """
            SELECT DISTINCT il.*
            FROM internal_list il
            LEFT JOIN jsonb_array_elements(il.aliases) a ON true
            WHERE il.tenant_id = :tenantId
              AND (
                    lower(il.name) LIKE '%' || :q || '%'
                    OR lower(a ->> 'lastName') LIKE '%' || :q || '%'
                  )
            """, nativeQuery = true)
    List<InternalListEntity> searchByNameAndTenant(@Param("q") String q,
                                                   @Param("tenantId") Long tenantId);

    // ⚠️ الفرق الجوهري عن LocalSanction:
    // التعطيل مقيّد بالـ tenant — ما بيلمس سجلات باقي الشركات إطلاقاً
    @Modifying
    @Query("""
            UPDATE InternalListEntity e
               SET e.active = false
             WHERE e.tenantId = :tenantId
               AND e.name NOT IN :names
            """)
    void deactivateMissingByTenant(@Param("tenantId") Long tenantId,
                                   @Param("names") List<String> names);
}