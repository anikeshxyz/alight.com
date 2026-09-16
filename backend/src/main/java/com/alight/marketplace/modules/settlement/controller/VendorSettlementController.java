package com.alight.marketplace.modules.settlement.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.settlement.dto.*;
import com.alight.marketplace.modules.settlement.service.SettlementService;
import com.alight.marketplace.modules.settlement.service.VendorRecoveryService;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/vendor/wallet")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VENDOR')")
@Tag(name = "Vendor Finance & Payouts", description = "Vendor Escrow wallet, double-entry ledger, and payout withdrawal management")
public class VendorSettlementController {

    private final SettlementService settlementService;
    private final VendorRecoveryService vendorRecoveryService;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;

    @GetMapping
    @Operation(summary = "Get current vendor wallet balances and bank details")
    public ResponseEntity<ApiResponse<VendorWalletDto>> getWallet(Authentication authentication) {
        VendorWalletDto wallet = settlementService.getWalletForCurrentUser(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(wallet));
    }

    @PutMapping("/bank-details")
    @Operation(summary = "Update vendor bank account details for payouts")
    public ResponseEntity<ApiResponse<VendorWalletDto>> updateBankDetails(
            @Valid @RequestBody BankDetailsDto dto,
            Authentication authentication
    ) {
        VendorWalletDto wallet = settlementService.updateBankDetails(authentication.getName(), dto);
        return ResponseEntity.ok(ApiResponse.success(wallet, "Bank account details updated successfully"));
    }

    @PostMapping("/payout-request")
    @Operation(summary = "Request payout withdrawal from available balance")
    public ResponseEntity<ApiResponse<VendorPayoutDto>> requestPayout(
            @Valid @RequestBody PayoutRequestDto dto,
            Authentication authentication
    ) {
        VendorPayoutDto payout = settlementService.requestPayout(authentication.getName(), dto);
        return ResponseEntity.ok(ApiResponse.success(payout, "Payout request submitted successfully"));
    }

    @GetMapping("/transactions")
    @Operation(summary = "Get vendor wallet ledger transactions paginated")
    public ResponseEntity<ApiResponse<Page<WalletTransactionDto>>> getTransactions(
            @PageableDefault(size = 20) Pageable pageable,
            Authentication authentication
    ) {
        Page<WalletTransactionDto> transactions = settlementService.getVendorTransactions(authentication.getName(), pageable);
        return ResponseEntity.ok(ApiResponse.success(transactions));
    }

    @GetMapping("/payouts")
    @Operation(summary = "Get vendor payout history paginated")
    public ResponseEntity<ApiResponse<Page<VendorPayoutDto>>> getPayouts(
            @PageableDefault(size = 20) Pageable pageable,
            Authentication authentication
    ) {
        Page<VendorPayoutDto> payouts = settlementService.getVendorPayouts(authentication.getName(), pageable);
        return ResponseEntity.ok(ApiResponse.success(payouts));
    }

    @GetMapping("/settlements")
    @Operation(summary = "Get vendor itemized settlements with calculation snapshots")
    public ResponseEntity<ApiResponse<Page<SettlementResponseDto>>> getSettlements(
            @PageableDefault(size = 20) Pageable pageable,
            Authentication authentication
    ) {
        Page<SettlementResponseDto> settlements = settlementService.getVendorSettlements(authentication.getName(), pageable);
        return ResponseEntity.ok(ApiResponse.success(settlements));
    }

    @GetMapping("/recoveries")
    @Operation(summary = "Get vendor debt recoveries and return deductions")
    public ResponseEntity<ApiResponse<Page<VendorDebtRecoveryDto>>> getRecoveries(
            @PageableDefault(size = 20) Pageable pageable,
            Authentication authentication
    ) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Vendor vendor = vendorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Vendor not found"));
        Page<VendorDebtRecoveryDto> recoveries = vendorRecoveryService.getVendorRecoveries(vendor.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(recoveries));
    }
}
