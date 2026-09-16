package com.alight.marketplace.modules.analytics.controller;

import com.alight.marketplace.common.exception.UnauthorizedException;
import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.analytics.dto.VendorAnalyticsOverviewDTO;
import com.alight.marketplace.modules.analytics.service.AnalyticsService;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vendor/analytics")
@RequiredArgsConstructor
@Tag(name = "Vendor Business Analytics", description = "Seller sales trajectory, earnings breakdown, and order velocity metrics")
@PreAuthorize("hasRole('VENDOR') or hasRole('ADMIN')")
public class VendorAnalyticsController {

    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;

    @GetMapping("/overview")
    @Operation(summary = "Get vendor sales trajectory, net earnings, and business performance metrics")
    public ResponseEntity<ApiResponse<VendorAnalyticsOverviewDTO>> getOverview(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID vendorId = resolveVendorId(userDetails);
        VendorAnalyticsOverviewDTO overview = analyticsService.getVendorAnalyticsOverview(vendorId);
        return ResponseEntity.ok(ApiResponse.success(overview, "Vendor analytics retrieved successfully"));
    }

    private UUID resolveVendorId(UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new UnauthorizedException("User not found: " + userDetails.getUsername()));
        Vendor vendor = vendorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new UnauthorizedException("Vendor profile not found for user: " + user.getId()));
        return vendor.getId();
    }
}
