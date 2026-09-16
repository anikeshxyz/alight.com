package com.alight.marketplace.modules.logistics.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.logistics.dto.AddTrackingEventRequest;
import com.alight.marketplace.modules.logistics.dto.LogisticsOverviewDto;
import com.alight.marketplace.modules.logistics.dto.ShipmentPackageDto;
import com.alight.marketplace.modules.logistics.dto.TrackingEventDto;
import com.alight.marketplace.modules.logistics.dto.TrackingTimelineDto;
import com.alight.marketplace.modules.logistics.entity.ShipmentStatus;
import com.alight.marketplace.modules.logistics.entity.ShippingCarrier;
import com.alight.marketplace.modules.logistics.repository.ShippingCarrierRepository;
import com.alight.marketplace.modules.logistics.service.LogisticsService;
import com.alight.marketplace.modules.logistics.service.ShipmentTrackingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/logistics")
@RequiredArgsConstructor
@Tag(name = "Admin Logistics Operations", description = "Marketplace-wide carrier management, logistics stats, and checkpoint dispatcher")
@PreAuthorize("hasRole('ADMIN')")
public class AdminLogisticsController {

    private final LogisticsService logisticsService;
    private final ShipmentTrackingService trackingService;
    private final ShippingCarrierRepository carrierRepository;

    @GetMapping("/overview")
    @Operation(summary = "Get platform-wide logistics operational metrics")
    public ResponseEntity<ApiResponse<LogisticsOverviewDto>> getLogisticsOverview() {
        LogisticsOverviewDto overview = logisticsService.getLogisticsOverview();
        return ResponseEntity.ok(ApiResponse.success(overview));
    }

    @GetMapping("/shipments")
    @Operation(summary = "Get all platform shipments with filter and pagination")
    public ResponseEntity<ApiResponse<Page<ShipmentPackageDto>>> getAllShipments(
            @RequestParam(required = false) ShipmentStatus status,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<ShipmentPackageDto> shipments = logisticsService.getAllShipments(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(shipments));
    }

    @GetMapping("/carriers")
    @Operation(summary = "List all integrated shipping carriers")
    public ResponseEntity<ApiResponse<List<ShippingCarrier>>> getCarriers() {
        List<ShippingCarrier> carriers = carrierRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success(carriers));
    }

    @PatchMapping("/carriers/{carrierId}/status")
    @Operation(summary = "Toggle carrier active status")
    public ResponseEntity<ApiResponse<ShippingCarrier>> toggleCarrierStatus(
            @PathVariable UUID carrierId,
            @RequestParam boolean active
    ) {
        ShippingCarrier carrier = carrierRepository.findById(carrierId)
                .orElseThrow(() -> new IllegalArgumentException("Carrier not found: " + carrierId));
        carrier.setActive(active);
        carrier = carrierRepository.save(carrier);
        return ResponseEntity.ok(ApiResponse.success(carrier, "Carrier status updated"));
    }

    @PostMapping("/shipments/{shipmentId}/checkpoint")
    @Operation(summary = "Simulate/Dispatch a tracking checkpoint update (Triggers escrow on DELIVERED)")
    public ResponseEntity<ApiResponse<TrackingTimelineDto>> dispatchCheckpoint(
            @PathVariable UUID shipmentId,
            @Valid @RequestBody AddTrackingEventRequest request
    ) {
        TrackingTimelineDto event = trackingService.addTrackingEvent(shipmentId, request);
        return ResponseEntity.ok(ApiResponse.success(event, "Checkpoint recorded successfully"));
    }
}
