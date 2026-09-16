package com.alight.marketplace.modules.audit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogDto {
    private UUID id;
    private UUID actorId;
    private String actorEmail;
    private String actorRole;
    private String action;
    private String resource;
    private String resourceId;
    private String result;
    private String ipAddress;
    private String userAgent;
    private String details;
    private Instant createdAt;
}
