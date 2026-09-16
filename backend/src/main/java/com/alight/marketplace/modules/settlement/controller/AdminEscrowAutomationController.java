package com.alight.marketplace.modules.settlement.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.settlement.dto.AutoSettlementResultDTO;
import com.alight.marketplace.modules.settlement.dto.CreatePayoutBatchRequest;
import com.alight.marketplace.modules.settlement.dto.PayoutBatchDTO;
import com.alight.marketplace.modules.settlement.service.EscrowAutomationService;
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
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/settlements/automation")
@RequiredArgsConstructor
@Tag(name = "Admin Escrow Automation", description = "Automated settlement release after return window and bulk payout batch processing")
@PreAuthorize("hasRole('ADMIN')")
public class AdminEscrowAutomationController {

    private final EscrowAutomationService automationService;

    @PostMapping("/run-auto-settlement")
    @Operation(summary = "Trigger automated settlement of delivered orders passing return-window period")
    public ResponseEntity<ApiResponse<AutoSettlementResultDTO>> triggerAutoSettlement() {
        AutoSettlementResultDTO result = automationService.runAutoSettlementForDeliveredOrders();
        return ResponseEntity.ok(ApiResponse.success(result, "Auto-settlement executed successfully"));
    }

    @PostMapping("/batches")
    @Operation(summary = "Group approved vendor payouts into a bulk processing batch")
    public ResponseEntity<ApiResponse<PayoutBatchDTO>> createPayoutBatch(
            @Valid @RequestBody CreatePayoutBatchRequest request
    ) {
        PayoutBatchDTO batch = automationService.createPayoutBatch(request);
        return ResponseEntity.ok(ApiResponse.success(batch, "Payout batch created successfully"));
    }

    @PostMapping("/batches/{id}/process")
    @Operation(summary = "Mark payout batch as processed and paid with bank transaction reference")
    public ResponseEntity<ApiResponse<PayoutBatchDTO>> processBatch(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String bankBatchId = body != null ? body.get("bankBatchId") : null;
        PayoutBatchDTO batch = automationService.processPayoutBatch(id, bankBatchId);
        return ResponseEntity.ok(ApiResponse.success(batch, "Payout batch marked as processed"));
    }

    @GetMapping("/batches")
    @Operation(summary = "Get all payout batches with pagination")
    public ResponseEntity<ApiResponse<Page<PayoutBatchDTO>>> getAllBatches(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<PayoutBatchDTO> batches = automationService.getAllPayoutBatches(pageable);
        return ResponseEntity.ok(ApiResponse.success(batches, "Payout batches retrieved successfully"));
    }

    @GetMapping("/batches/{id}")
    @Operation(summary = "Get specific payout batch details")
    public ResponseEntity<ApiResponse<PayoutBatchDTO>> getBatchById(@PathVariable UUID id) {
        PayoutBatchDTO batch = automationService.getPayoutBatchById(id);
        return ResponseEntity.ok(ApiResponse.success(batch, "Payout batch details retrieved"));
    }
}
