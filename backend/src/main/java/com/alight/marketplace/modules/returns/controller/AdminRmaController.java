package com.alight.marketplace.modules.returns.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.returns.dto.*;
import com.alight.marketplace.modules.returns.entity.RmaStatus;
import com.alight.marketplace.modules.returns.service.RmaPolicyService;
import com.alight.marketplace.modules.returns.service.RmaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/returns")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin RMA Oversight & Policies", description = "Global RMA management, dispute arbitration, and policy configuration")
public class AdminRmaController {

    private final RmaService rmaService;
    private final RmaPolicyService rmaPolicyService;

    @GetMapping
    @Operation(summary = "Search all marketplace return requests")
    public ResponseEntity<ApiResponse<Page<RmaResponseDto>>> searchAllReturns(
            @RequestParam(required = false) RmaStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<RmaResponseDto> returns = rmaService.searchAllRmasAdmin(status, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(returns, "Marketplace returns retrieved"));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get global marketplace RMA statistics")
    public ResponseEntity<ApiResponse<RmaStatsSummaryDto>> getAdminStats() {
        RmaStatsSummaryDto stats = rmaService.getAdminRmaStats();
        return ResponseEntity.ok(ApiResponse.success(stats, "Marketplace RMA stats retrieved"));
    }

    @GetMapping("/{rmaId}")
    @Operation(summary = "Get RMA details by ID")
    public ResponseEntity<ApiResponse<RmaResponseDto>> getRmaDetails(@PathVariable UUID rmaId) {
        RmaResponseDto response = rmaService.getRmaByIdAdmin(rmaId);
        return ResponseEntity.ok(ApiResponse.success(response, "RMA details retrieved"));
    }

    @PostMapping("/{rmaId}/override")
    @Operation(summary = "Admin dispute override / force resolution")
    public ResponseEntity<ApiResponse<RmaResponseDto>> adminOverride(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID rmaId,
            @Valid @RequestBody RmaInspectionRequestDto dto
    ) {
        RmaResponseDto response = rmaService.adminOverrideRma(rmaId, userDetails.getUsername(), dto);
        return ResponseEntity.ok(ApiResponse.success(response, "RMA dispute override applied"));
    }

    // Policy Management
    @GetMapping("/policies")
    @Operation(summary = "Get all category and marketplace return policies")
    public ResponseEntity<ApiResponse<List<RmaPolicyDto>>> getAllPolicies() {
        List<RmaPolicyDto> policies = rmaPolicyService.getAllPolicies();
        return ResponseEntity.ok(ApiResponse.success(policies, "RMA policies retrieved"));
    }

    @PostMapping("/policies")
    @Operation(summary = "Create a return policy rule")
    public ResponseEntity<ApiResponse<RmaPolicyDto>> createPolicy(@Valid @RequestBody RmaPolicyDto dto) {
        RmaPolicyDto policy = rmaPolicyService.createPolicy(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(policy, "Return policy created successfully"));
    }

    @PutMapping("/policies/{id}")
    @Operation(summary = "Update a return policy rule")
    public ResponseEntity<ApiResponse<RmaPolicyDto>> updatePolicy(
            @PathVariable UUID id,
            @Valid @RequestBody RmaPolicyDto dto
    ) {
        RmaPolicyDto policy = rmaPolicyService.updatePolicy(id, dto);
        return ResponseEntity.ok(ApiResponse.success(policy, "Return policy updated successfully"));
    }

    @DeleteMapping("/policies/{id}")
    @Operation(summary = "Delete a return policy rule")
    public ResponseEntity<ApiResponse<Void>> deletePolicy(@PathVariable UUID id) {
        rmaPolicyService.deletePolicy(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Return policy deleted successfully"));
    }
}
