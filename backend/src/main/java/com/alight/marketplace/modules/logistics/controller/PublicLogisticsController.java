package com.alight.marketplace.modules.logistics.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.logistics.dto.*;
import com.alight.marketplace.modules.logistics.entity.ShippingCarrier;
import com.alight.marketplace.modules.logistics.service.LogisticsService;
import com.alight.marketplace.modules.logistics.service.ShipmentTrackingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/logistics")
@RequiredArgsConstructor
@Tag(name = "Public Logistics", description = "Endpoints for pincode serviceability, rates, and public shipment tracking")
public class PublicLogisticsController {

    private final LogisticsService logisticsService;
    private final ShipmentTrackingService trackingService;

    @GetMapping("/serviceability")
    @Operation(summary = "Check pincode serviceability and delivery ETA")
    public ResponseEntity<ApiResponse<ServiceabilityResponseDto>> checkServiceability(
            @RequestParam String destinationPincode,
            @RequestParam(required = false) String originPincode) {
        ServiceabilityResponseDto res = logisticsService.checkServiceability(destinationPincode, originPincode);
        return ResponseEntity.ok(ApiResponse.success(res, "Pincode serviceability retrieved"));
    }

    @PostMapping("/rates")
    @Operation(summary = "Calculate shipping freight rates across carriers")
    public ResponseEntity<ApiResponse<List<ShippingRateDto>>> calculateRates(
            @Valid @RequestBody RateCalculationRequest request) {
        List<ShippingRateDto> rates = logisticsService.calculateRates(request);
        return ResponseEntity.ok(ApiResponse.success(rates, "Shipping rates calculated"));
    }

    @GetMapping("/track/{identifier}")
    @Operation(summary = "Track shipment timeline by AWB or Order Number")
    public ResponseEntity<ApiResponse<TrackingTimelineDto>> trackShipment(@PathVariable String identifier) {
        TrackingTimelineDto timeline;
        if (identifier.toUpperCase().startsWith("ORD-")) {
            timeline = trackingService.getTrackingTimelineByOrderNumber(identifier);
        } else {
            timeline = trackingService.getTrackingTimelineByAwb(identifier);
        }
        return ResponseEntity.ok(ApiResponse.success(timeline, "Tracking details retrieved"));
    }

    @GetMapping("/carriers")
    @Operation(summary = "List active shipping carriers")
    public ResponseEntity<ApiResponse<List<ShippingCarrier>>> getActiveCarriers() {
        List<ShippingCarrier> carriers = logisticsService.getAllCarriers();
        return ResponseEntity.ok(ApiResponse.success(carriers, "Active carriers list"));
    }

    @GetMapping("/shipments/{shipmentId}/label")
    @Operation(summary = "Get printable shipping label payload")
    public ResponseEntity<ApiResponse<ShippingLabelDto>> getShippingLabel(@PathVariable UUID shipmentId) {
        ShippingLabelDto label = logisticsService.generateShippingLabel(shipmentId);
        return ResponseEntity.ok(ApiResponse.success(label, "Shipping label generated"));
    }
}
