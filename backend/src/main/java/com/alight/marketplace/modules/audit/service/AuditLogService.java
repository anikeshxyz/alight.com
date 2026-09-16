package com.alight.marketplace.modules.audit.service;

import com.alight.marketplace.modules.audit.dto.AuditLogDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface AuditLogService {

    void log(UUID actorId, String actorEmail, String actorRole, String action, String resource, String resourceId, String result, String ipAddress, String userAgent, String details);

    void recordEvent(String action, String resource, String resourceId, String details);

    Page<AuditLogDto> getAuditLogs(String action, String resource, String search, Pageable pageable);
}
