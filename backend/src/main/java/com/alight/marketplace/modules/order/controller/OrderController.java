package com.alight.marketplace.modules.order.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.order.dto.OrderDto;
import com.alight.marketplace.modules.order.service.OrderService;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import com.alight.marketplace.modules.order.entity.OrderStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Customer Orders", description = "Customer master order lookup and history")
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    @GetMapping("/{orderNumber}")
    @Operation(summary = "Get order by order number", description = "Returns full order details with vendor sub-orders and tracking")
    public ResponseEntity<ApiResponse<OrderDto>> getOrderByNumber(
            @PathVariable String orderNumber,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = resolveUserId(userDetails);
        boolean isAdmin = userDetails != null && userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        OrderDto order = orderService.getOrderByNumber(orderNumber, userId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @GetMapping("/my-orders")
    @Operation(summary = "Get current customer orders", description = "Paginated list of orders placed by authenticated user with optional status filter")
    public ResponseEntity<ApiResponse<Page<OrderDto>>> getMyOrders(
            @RequestParam(required = false) OrderStatus status,
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        UUID userId = resolveUserId(userDetails);
        if (userId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Authentication required"));
        }
        Page<OrderDto> orders = orderService.getCustomerOrders(userId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    private UUID resolveUserId(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElse(null);
    }
}
