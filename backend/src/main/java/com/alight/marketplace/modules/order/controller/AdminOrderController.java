package com.alight.marketplace.modules.order.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.order.dto.OrderDto;
import com.alight.marketplace.modules.order.entity.OrderStatus;
import com.alight.marketplace.modules.order.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/orders")
@RequiredArgsConstructor
@Tag(name = "Admin Orders", description = "Global marketplace orders explorer and status overrides")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping
    @Operation(summary = "Get all marketplace orders", description = "Paginated list of master orders with optional status filter")
    public ResponseEntity<ApiResponse<Page<OrderDto>>> getAllOrders(
            @RequestParam(required = false) OrderStatus status,
            @PageableDefault(size = 15) Pageable pageable
    ) {
        Page<OrderDto> orders = orderService.getAllOrdersAdmin(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @PutMapping("/{orderId}/status")
    @Operation(summary = "Update master order status", description = "Admin status modification (e.g. CANCELLED, REFUNDED, DELIVERED)")
    public ResponseEntity<ApiResponse<OrderDto>> updateOrderStatus(
            @PathVariable UUID orderId,
            @RequestParam OrderStatus status
    ) {
        OrderDto updated = orderService.updateOrderStatusAdmin(orderId, status);
        return ResponseEntity.ok(ApiResponse.success(updated, "Order status updated successfully"));
    }
}
