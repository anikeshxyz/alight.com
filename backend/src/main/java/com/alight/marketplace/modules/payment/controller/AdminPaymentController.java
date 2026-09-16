package com.alight.marketplace.modules.payment.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.payment.dto.PaymentTransactionDto;
import com.alight.marketplace.modules.payment.dto.RefundRequestDto;
import com.alight.marketplace.modules.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/payments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Payments", description = "Global transaction explorer and refund operations")
public class AdminPaymentController {

    private final PaymentService paymentService;

    @GetMapping("/transactions")
    @Operation(summary = "Get all platform transactions paginated")
    public ResponseEntity<ApiResponse<Page<PaymentTransactionDto>>> getAllTransactions(
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<PaymentTransactionDto> transactions = paymentService.getAdminTransactions(pageable);
        return ResponseEntity.ok(ApiResponse.success(transactions));
    }

    @PostMapping("/{transactionId}/approve-bank-transfer")
    @Operation(summary = "Approve offline B2B bank transfer after verifying bank credit")
    public ResponseEntity<ApiResponse<PaymentTransactionDto>> approveBankTransfer(
            @PathVariable UUID transactionId,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String adminNotes = body != null ? body.get("adminNotes") : "Approved by Finance";
        PaymentTransactionDto tx = paymentService.approveBankTransferPayment(transactionId, adminNotes);
        return ResponseEntity.ok(ApiResponse.success(tx, "Bank transfer cleared and verified"));
    }

    @PostMapping("/refund")
    @Operation(summary = "Process full or partial refund on transaction")
    public ResponseEntity<ApiResponse<PaymentTransactionDto>> processRefund(
            @Valid @RequestBody RefundRequestDto request
    ) {
        PaymentTransactionDto refunded = paymentService.processRefund(request);
        return ResponseEntity.ok(ApiResponse.success(refunded, "Refund processed successfully"));
    }
}
