package com.alight.marketplace.modules.logistics.controller;

import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.logistics.dto.CreateShipmentRequest;
import com.alight.marketplace.modules.logistics.dto.ShipmentPackageDto;
import com.alight.marketplace.modules.logistics.dto.ShippingLabelDto;
import com.alight.marketplace.modules.logistics.service.LogisticsService;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vendor/logistics")
@RequiredArgsConstructor
@Tag(name = "Vendor Logistics", description = "Vendor shipment booking, dispatch and shipping label generation")
@PreAuthorize("hasRole('VENDOR') or hasRole('ADMIN')")
public class VendorLogisticsController {

    private final LogisticsService logisticsService;
    private final VendorRepository vendorRepository;

    private Vendor resolveVendor(UserDetails userDetails) {
        return vendorRepository.findByUserEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor profile not found for user: " + userDetails.getUsername()));
    }

    @PostMapping("/shipments")
    @Operation(summary = "Book shipment & generate carrier AWB")
    public ResponseEntity<ApiResponse<ShipmentPackageDto>> createShipment(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateShipmentRequest request
    ) {
        Vendor vendor = resolveVendor(userDetails);
        ShipmentPackageDto shipment = logisticsService.createShipment(request, vendor.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(shipment, "Shipment booked successfully with AWB " + shipment.getAwbNumber()));
    }

    @GetMapping("/shipments")
    @Operation(summary = "Get all shipments for vendor")
    public ResponseEntity<ApiResponse<Page<ShipmentPackageDto>>> getVendorShipments(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Vendor vendor = resolveVendor(userDetails);
        Page<ShipmentPackageDto> shipments = logisticsService.getVendorShipments(vendor.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(shipments));
    }

    @GetMapping("/shipments/{shipmentId}/label")
    @Operation(summary = "Generate 4x6 / A4 thermal printable shipping label")
    public ResponseEntity<ApiResponse<ShippingLabelDto>> getShippingLabel(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID shipmentId
    ) {
        ShippingLabelDto label = logisticsService.generateShippingLabel(shipmentId);
        return ResponseEntity.ok(ApiResponse.success(label, "Shipping label generated"));
    }

    @PostMapping("/shipments/{shipmentId}/pickup")
    @Operation(summary = "Schedule carrier doorstep pickup")
    public ResponseEntity<ApiResponse<ShipmentPackageDto>> schedulePickup(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID shipmentId,
            @RequestParam(required = false) String notes
    ) {
        ShipmentPackageDto shipment = logisticsService.scheduleDoorstepPickup(shipmentId, notes);
        return ResponseEntity.ok(ApiResponse.success(shipment, "Pickup scheduled successfully"));
    }
}
