package com.alight.marketplace.modules.order.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.order.dto.CheckoutSummaryDto;
import com.alight.marketplace.modules.order.dto.InitiateCheckoutRequest;
import com.alight.marketplace.modules.order.dto.OrderDto;
import com.alight.marketplace.modules.order.service.CheckoutService;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/checkout")
@RequiredArgsConstructor
@Tag(name = "Checkout", description = "Multi-vendor checkout calculation, stock reservation, and master order creation")
public class CheckoutController {

    private final CheckoutService checkoutService;
    private final UserRepository userRepository;

    @PostMapping("/preview")
    @Operation(summary = "Preview checkout totals", description = "Calculates multi-vendor subtotal, GST taxes, volume tier discounts and shipping before placing order")
    public ResponseEntity<ApiResponse<CheckoutSummaryDto>> previewCheckout(
            @Valid @RequestBody InitiateCheckoutRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = resolveUserId(userDetails);
        CheckoutSummaryDto summary = checkoutService.previewCheckout(userId, request);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @PostMapping
    @Operation(summary = "Initiate and place order", description = "Reserves warehouse inventory, validates taxes, generates Master Order and Vendor Sub-Orders")
    public ResponseEntity<ApiResponse<OrderDto>> initiateCheckout(
            @Valid @RequestBody InitiateCheckoutRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = resolveUserId(userDetails);
        OrderDto order = checkoutService.initiateCheckout(userId, request);
        return ResponseEntity.ok(ApiResponse.success(order, "Order placed successfully"));
    }

    private UUID resolveUserId(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElse(null);
    }
}
