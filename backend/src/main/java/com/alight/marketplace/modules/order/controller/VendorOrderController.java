package com.alight.marketplace.modules.order.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.order.dto.UpdateFulfillmentRequest;
import com.alight.marketplace.modules.order.dto.VendorOrderDto;
import com.alight.marketplace.modules.order.entity.FulfillmentStatus;
import com.alight.marketplace.modules.order.service.OrderService;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vendor/orders")
@RequiredArgsConstructor
@Tag(name = "Vendor Sub-Orders", description = "Vendor fulfillment hub, tracking numbers, courier integration")
@PreAuthorize("hasAnyRole('VENDOR', 'ADMIN')")
public class VendorOrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    @GetMapping
    @Operation(summary = "Get vendor sub-orders", description = "Paginated list of sub-orders assigned to authenticated vendor")
    public ResponseEntity<ApiResponse<Page<VendorOrderDto>>> getVendorOrders(
            @RequestParam(required = false) FulfillmentStatus status,
            @PageableDefault(size = 10) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = resolveUserId(userDetails);
        Page<VendorOrderDto> orders = orderService.getVendorOrders(userId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @PutMapping("/{vendorOrderId}/fulfillment")
    @Operation(summary = "Update sub-order fulfillment status", description = "Updates tracking number, courier partner (e.g. Blue Dart/Delhivery), and status")
    public ResponseEntity<ApiResponse<VendorOrderDto>> updateFulfillment(
            @PathVariable UUID vendorOrderId,
            @Valid @RequestBody UpdateFulfillmentRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = resolveUserId(userDetails);
        VendorOrderDto updated = orderService.updateVendorOrderFulfillment(userId, vendorOrderId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Fulfillment updated successfully"));
    }

    private UUID resolveUserId(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElse(null);
    }
}
