package com.alight.marketplace.modules.audit.service.impl;

import com.alight.marketplace.modules.audit.dto.AuditLogDto;
import com.alight.marketplace.modules.audit.entity.AuditLog;
import com.alight.marketplace.modules.audit.repository.AuditLogRepository;
import com.alight.marketplace.modules.audit.service.AuditLogService;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(UUID actorId, String actorEmail, String actorRole, String action, String resource, String resourceId, String result, String ipAddress, String userAgent, String details) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .actorId(actorId)
                    .actorEmail(actorEmail)
                    .actorRole(actorRole)
                    .action(action)
                    .resource(resource)
                    .resourceId(resourceId)
                    .result(result != null ? result : "SUCCESS")
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .details(details)
                    .build();

            auditLogRepository.save(auditLog);
            log.info("AUDIT: [{} by {} ({})] on {}/{} - result: {}", action, actorEmail, actorRole, resource, resourceId, result);
        } catch (Exception e) {
            log.error("Failed to write audit log: {}", e.getMessage(), e);
        }
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordEvent(String action, String resource, String resourceId, String details) {
        UUID actorId = null;
        String actorEmail = "SYSTEM";
        String actorRole = "SYSTEM";

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            actorEmail = auth.getName();
            if (auth.getAuthorities() != null && !auth.getAuthorities().isEmpty()) {
                actorRole = auth.getAuthorities().iterator().next().getAuthority();
            }
            try {
                User user = userRepository.findByEmail(actorEmail).orElse(null);
                if (user != null) {
                    actorId = user.getId();
                }
            } catch (Exception ignored) {
            }
        }

        log(actorId, actorEmail, actorRole, action, resource, resourceId, "SUCCESS", null, null, details);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogDto> getAuditLogs(String action, String resource, String search, Pageable pageable) {
        return auditLogRepository.searchAuditLogs(action, resource, search, pageable)
                .map(log -> AuditLogDto.builder()
                        .id(log.getId())
                        .actorId(log.getActorId())
                        .actorEmail(log.getActorEmail())
                        .actorRole(log.getActorRole())
                        .action(log.getAction())
                        .resource(log.getResource())
                        .resourceId(log.getResourceId())
                        .result(log.getResult())
                        .ipAddress(log.getIpAddress())
                        .userAgent(log.getUserAgent())
                        .details(log.getDetails())
                        .createdAt(log.getCreatedAt())
                        .build());
    }
}
