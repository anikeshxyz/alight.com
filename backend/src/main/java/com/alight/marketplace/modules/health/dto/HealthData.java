package com.alight.marketplace.modules.health.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class HealthData {
    private String status;
    private String version;
    private String environment;
    private Instant timestamp;
    private Long uptimeSeconds;
    private DatabaseHealth database;
    private MemoryHealth memory;
    private Map<String, Object> details;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DatabaseHealth {
        private String status;
        private String databaseProductName;
        private String databaseProductVersion;
        private Long responseTimeMs;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemoryHealth {
        private long maxMb;
        private long totalMb;
        private long freeMb;
        private long usedMb;
    }
}
