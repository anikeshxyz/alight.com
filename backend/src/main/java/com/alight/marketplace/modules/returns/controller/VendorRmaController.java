package com.alight.marketplace.modules.returns.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.returns.dto.*;
import com.alight.marketplace.modules.returns.entity.RmaStatus;
import com.alight.marketplace.modules.returns.service.RmaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vendor/returns")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VENDOR')")
@Tag(name = "Vendor RMA Operations", description = "Vendor return requests review, reverse pickup and QA inspection")
public class VendorRmaController {

    private final RmaService rmaService;

    @GetMapping
    @Operation(summary = "Get vendor return requests with optional status filter")
    public ResponseEntity<ApiResponse<Page<RmaResponseDto>>> getVendorReturns(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) RmaStatus status,
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<RmaResponseDto> returns = rmaService.getVendorReturns(userDetails.getUsername(), status, pageable);
        return ResponseEntity.ok(ApiResponse.success(returns, "Vendor returns retrieved"));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get vendor RMA metrics breakdown")
    public ResponseEntity<ApiResponse<RmaStatsSummaryDto>> getVendorRmaStats(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        RmaStatsSummaryDto stats = rmaService.getVendorRmaStats(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(stats, "Vendor RMA stats retrieved"));
    }

    @GetMapping("/{rmaId}")
    @Operation(summary = "Get vendor RMA details")
    public ResponseEntity<ApiResponse<RmaResponseDto>> getVendorRmaDetails(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID rmaId
    ) {
        RmaResponseDto response = rmaService.getVendorRmaById(rmaId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Vendor RMA details retrieved"));
    }

    @PostMapping("/{rmaId}/review")
    @Operation(summary = "Review and Approve/Reject an RMA request")
    public ResponseEntity<ApiResponse<RmaResponseDto>> reviewRma(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID rmaId,
            @Valid @RequestBody RmaReviewRequestDto dto
    ) {
        RmaResponseDto response = rmaService.reviewRmaByVendor(rmaId, userDetails.getUsername(), dto);
        return ResponseEntity.ok(ApiResponse.success(response, "RMA review status updated successfully"));
    }

    @PostMapping("/{rmaId}/schedule-pickup")
    @Operation(summary = "Schedule reverse courier pickup and allocate reverse AWB")
    public ResponseEntity<ApiResponse<RmaResponseDto>> schedulePickup(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID rmaId,
            @Valid @RequestBody RmaSchedulePickupDto dto
    ) {
        RmaResponseDto response = rmaService.scheduleReversePickup(rmaId, userDetails.getUsername(), dto);
        return ResponseEntity.ok(ApiResponse.success(response, "Reverse courier pickup scheduled successfully"));
    }

    @PostMapping("/{rmaId}/inspect")
    @Operation(summary = "Perform warehouse QA inspection, restock inventory and trigger refund")
    public ResponseEntity<ApiResponse<RmaResponseDto>> inspectRma(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID rmaId,
            @Valid @RequestBody RmaInspectionRequestDto dto
    ) {
        RmaResponseDto response = rmaService.inspectRmaItems(rmaId, userDetails.getUsername(), dto);
        return ResponseEntity.ok(ApiResponse.success(response, "RMA QA inspection processed successfully"));
    }
}
