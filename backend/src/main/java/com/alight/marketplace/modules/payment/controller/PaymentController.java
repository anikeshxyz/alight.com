package com.alight.marketplace.modules.payment.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.payment.dto.InitiatePaymentRequest;
import com.alight.marketplace.modules.payment.dto.InitiatePaymentResponse;
import com.alight.marketplace.modules.payment.dto.PaymentTransactionDto;
import com.alight.marketplace.modules.payment.dto.VerifyPaymentRequest;
import com.alight.marketplace.modules.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payment Gateway", description = "Multi-gateway payment initiation and signature verification APIs")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/initiate")
    @Operation(summary = "Initiate gateway payment order (Razorpay/Stripe/Bank Transfer/Mock)")
    public ResponseEntity<ApiResponse<InitiatePaymentResponse>> initiatePayment(
            @Valid @RequestBody InitiatePaymentRequest request,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : null;
        InitiatePaymentResponse response = paymentService.initiatePayment(request, email);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment initiated successfully"));
    }

    @PostMapping("/verify")
    @Operation(summary = "Verify gateway payment signature and capture order")
    public ResponseEntity<ApiResponse<PaymentTransactionDto>> verifyPayment(
            @Valid @RequestBody VerifyPaymentRequest request,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : null;
        PaymentTransactionDto response = paymentService.verifyPayment(request, email);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment captured and verified successfully"));
    }

    @GetMapping("/order/{orderId}")
    @Operation(summary = "Get all payment transactions for an order")
    public ResponseEntity<ApiResponse<List<PaymentTransactionDto>>> getOrderTransactions(@PathVariable UUID orderId) {
        List<PaymentTransactionDto> transactions = paymentService.getTransactionsForOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success(transactions));
    }

    @GetMapping("/my-payments")
    @Operation(summary = "Get current customer's payment transactions history")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<PaymentTransactionDto>>> getMyPayments(
            Authentication authentication,
            @org.springframework.data.web.PageableDefault(size = 10) org.springframework.data.domain.Pageable pageable
    ) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Authentication required"));
        }
        org.springframework.data.domain.Page<PaymentTransactionDto> payments = paymentService.getCustomerPayments(authentication.getName(), pageable);
        return ResponseEntity.ok(ApiResponse.success(payments));
    }
}
