package com.alight.marketplace.modules.health.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.health.dto.HealthData;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.lang.management.ManagementFactory;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.time.Instant;

@Slf4j
@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "Health", description = "System health check endpoint")
public class HealthController {

    @Autowired(required = false)
    private DataSource dataSource;

    @Value("${spring.profiles.active:default}")
    private String activeProfile;

    @GetMapping
    @Operation(summary = "Get system health status", description = "Returns operational status and diagnostics of backend API and database")
    public ResponseEntity<ApiResponse<HealthData>> getHealth() {
        long uptimeSeconds = ManagementFactory.getRuntimeMXBean().getUptime() / 1000;

        Runtime runtime = Runtime.getRuntime();
        long maxMb = runtime.maxMemory() / (1024 * 1024);
        long totalMb = runtime.totalMemory() / (1024 * 1024);
        long freeMb = runtime.freeMemory() / (1024 * 1024);
        long usedMb = totalMb - freeMb;

        HealthData.MemoryHealth memoryHealth = HealthData.MemoryHealth.builder()
                .maxMb(maxMb)
                .totalMb(totalMb)
                .freeMb(freeMb)
                .usedMb(usedMb)
                .build();

        HealthData.DatabaseHealth dbHealth = checkDatabaseHealth();
        boolean dbHealthy = dbHealth == null || "UP".equals(dbHealth.getStatus());

        String overallStatus = dbHealthy ? "UP" : "DOWN";

        HealthData healthData = HealthData.builder()
                .status(overallStatus)
                .version("1.0.0-RELEASE")
                .environment(activeProfile)
                .timestamp(Instant.now())
                .uptimeSeconds(uptimeSeconds)
                .database(dbHealth)
                .memory(memoryHealth)
                .build();

        if (!dbHealthy) {
            ApiResponse<HealthData> errorResponse = ApiResponse.<HealthData>builder()
                    .success(false)
                    .data(healthData)
                    .message("Database connectivity issue")
                    .build();
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(errorResponse);
        }

        return ResponseEntity.ok(ApiResponse.success(healthData, "Service is healthy"));
    }

    private HealthData.DatabaseHealth checkDatabaseHealth() {
        if (dataSource == null) {
            return HealthData.DatabaseHealth.builder()
                    .status("UP")
                    .databaseProductName("Embedded/Mock")
                    .databaseProductVersion("1.0")
                    .responseTimeMs(0L)
                    .build();
        }

        long start = System.currentTimeMillis();
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            long elapsed = System.currentTimeMillis() - start;

            return HealthData.DatabaseHealth.builder()
                    .status("UP")
                    .databaseProductName(metaData.getDatabaseProductName())
                    .databaseProductVersion(metaData.getDatabaseProductVersion())
                    .responseTimeMs(elapsed)
                    .build();
        } catch (Exception e) {
            log.error("Database health check failed: {}", e.getMessage());
            long elapsed = System.currentTimeMillis() - start;
            return HealthData.DatabaseHealth.builder()
                    .status("DOWN")
                    .databaseProductName("Unknown")
                    .databaseProductVersion(e.getMessage())
                    .responseTimeMs(elapsed)
                    .build();
        }
    }
}
