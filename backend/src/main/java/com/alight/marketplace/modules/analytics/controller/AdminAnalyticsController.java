package com.alight.marketplace.modules.analytics.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.analytics.dto.AdminAnalyticsOverviewDTO;
import com.alight.marketplace.modules.analytics.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/analytics")
@RequiredArgsConstructor
@Tag(name = "Admin Executive Analytics", description = "Marketplace GMV, net revenues, category performance, and seller growth intelligence")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/overview")
    @Operation(summary = "Get platform executive analytics overview, GMV metrics, and revenue trajectory")
    public ResponseEntity<ApiResponse<AdminAnalyticsOverviewDTO>> getOverview() {
        AdminAnalyticsOverviewDTO overview = analyticsService.getAdminAnalyticsOverview();
        return ResponseEntity.ok(ApiResponse.success(overview, "Executive analytics retrieved successfully"));
    }
}
