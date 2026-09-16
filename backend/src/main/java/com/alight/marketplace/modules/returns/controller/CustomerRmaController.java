package com.alight.marketplace.modules.returns.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.returns.dto.CreateRmaRequestDto;
import com.alight.marketplace.modules.returns.dto.RmaPolicyDto;
import com.alight.marketplace.modules.returns.dto.RmaResponseDto;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/returns")
@RequiredArgsConstructor
@Tag(name = "Customer RMA & Returns", description = "Customer self-service return requests and tracking")
public class CustomerRmaController {

    private final RmaService rmaService;
    private final RmaPolicyService rmaPolicyService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Submit a return request")
    public ResponseEntity<ApiResponse<RmaResponseDto>> createReturn(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateRmaRequestDto dto
    ) {
        RmaResponseDto response = rmaService.createRmaRequest(userDetails.getUsername(), dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Return request created successfully"));
    }

    @GetMapping("/my-returns")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get current customer's return requests")
    public ResponseEntity<ApiResponse<Page<RmaResponseDto>>> getMyReturns(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<RmaResponseDto> returns = rmaService.getMyReturns(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(ApiResponse.success(returns, "Return requests retrieved"));
    }

    @GetMapping("/{rmaNumber}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get RMA details and event history by RMA number")
    public ResponseEntity<ApiResponse<RmaResponseDto>> getRmaDetails(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String rmaNumber
    ) {
        RmaResponseDto response = rmaService.getRmaByNumber(rmaNumber, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "RMA details retrieved"));
    }

    @PostMapping("/{rmaNumber}/cancel")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Cancel a pending return request")
    public ResponseEntity<ApiResponse<RmaResponseDto>> cancelReturn(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String rmaNumber
    ) {
        RmaResponseDto response = rmaService.cancelRmaRequest(rmaNumber, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Return request cancelled successfully"));
    }

    @GetMapping("/policy")
    @Operation(summary = "Check effective return policy for category or vendor")
    public ResponseEntity<ApiResponse<RmaPolicyDto>> getEffectivePolicy(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID vendorId
    ) {
        RmaPolicyDto policy = rmaPolicyService.getEffectivePolicy(categoryId, vendorId);
        return ResponseEntity.ok(ApiResponse.success(policy, "Return policy retrieved"));
    }
}
