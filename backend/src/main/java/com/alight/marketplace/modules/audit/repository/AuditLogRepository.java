package com.alight.marketplace.modules.audit.repository;

import com.alight.marketplace.modules.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    Page<AuditLog> findByAction(String action, Pageable pageable);

    Page<AuditLog> findByResourceAndResourceId(String resource, String resourceId, Pageable pageable);

    Page<AuditLog> findByActorId(UUID actorId, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:resource IS NULL OR a.resource = :resource) AND " +
           "(:search IS NULL OR LOWER(a.actorEmail) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           " LOWER(a.details) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    Page<AuditLog> searchAuditLogs(
            @Param("action") String action,
            @Param("resource") String resource,
            @Param("search") String search,
            Pageable pageable
    );
}
