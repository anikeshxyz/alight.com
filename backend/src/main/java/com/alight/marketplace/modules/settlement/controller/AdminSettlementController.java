package com.alight.marketplace.modules.settlement.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.settlement.dto.*;
import com.alight.marketplace.modules.settlement.entity.PayoutStatus;
import com.alight.marketplace.modules.settlement.entity.SettlementAdjustment;
import com.alight.marketplace.modules.settlement.entity.SettlementStatus;
import com.alight.marketplace.modules.settlement.service.ReconciliationService;
import com.alight.marketplace.modules.settlement.service.SettlementService;
import com.alight.marketplace.modules.settlement.service.VendorRecoveryService;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/settlements")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Settlements & Escrow", description = "Global Escrow oversight, payout batch disbursements, and financial auditing")
public class AdminSettlementController {

    private final SettlementService settlementService;
    private final VendorRecoveryService vendorRecoveryService;
    private final ReconciliationService reconciliationService;

    @GetMapping("/overview")
    @Operation(summary = "Get global platform Escrow and settlement overview")
    public ResponseEntity<ApiResponse<SettlementOverviewDto>> getOverview() {
        SettlementOverviewDto overview = settlementService.getAdminOverview();
        return ResponseEntity.ok(ApiResponse.success(overview));
    }

    @GetMapping("/payouts")
    @Operation(summary = "Get all vendor payout requests paginated")
    public ResponseEntity<ApiResponse<Page<VendorPayoutDto>>> getPayouts(
            @RequestParam(required = false) PayoutStatus status,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<VendorPayoutDto> payouts = settlementService.getAdminPayouts(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(payouts));
    }

    @PostMapping("/payouts/{payoutId}/approve")
    @Operation(summary = "Approve and mark vendor payout as settled with UTR bank reference")
    public ResponseEntity<ApiResponse<VendorPayoutDto>> approvePayout(
            @PathVariable UUID payoutId,
            @RequestBody(required = false) ProcessPayoutRequest request
    ) {
        String utr = request != null ? request.getUtrNumber() : null;
        String notes = request != null ? request.getAdminNotes() : null;
        VendorPayoutDto payout = settlementService.approvePayout(payoutId, utr, notes);
        return ResponseEntity.ok(ApiResponse.success(payout, "Payout approved and processed successfully"));
    }

    @PostMapping("/payouts/{payoutId}/reject")
    @Operation(summary = "Reject vendor payout request and refund amount back to vendor available balance")
    public ResponseEntity<ApiResponse<VendorPayoutDto>> rejectPayout(
            @PathVariable UUID payoutId,
            @RequestBody(required = false) ProcessPayoutRequest request
    ) {
        String reason = request != null ? request.getRejectionReason() : "Rejected by Administrator";
        String notes = request != null ? request.getAdminNotes() : null;
        VendorPayoutDto payout = settlementService.rejectPayout(payoutId, reason, notes);
        return ResponseEntity.ok(ApiResponse.success(payout, "Payout request rejected and balance refunded"));
    }

    @GetMapping("/delivered")
    @Operation(summary = "Get all delivered sub-orders with their settlement calculations")
    public ResponseEntity<ApiResponse<List<DeliveredSettlementDto>>> getDeliveredSettlements() {
        var list = settlementService.getDeliveredSettlements();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/release/{vendorOrderId}")
    @Operation(summary = "Manually trigger escrow release for a specific delivered sub-order")
    public ResponseEntity<ApiResponse<Void>> releaseEscrowForOrder(@PathVariable UUID vendorOrderId) {
        settlementService.releaseEscrow(vendorOrderId);
        return ResponseEntity.ok(ApiResponse.success(null, "Escrow successfully evaluated/released for sub-order"));
    }

    @GetMapping("/wallets")
    @Operation(summary = "Get all vendor wallets with available and escrow balances")
    public ResponseEntity<ApiResponse<List<VendorWalletDto>>> getAllWallets() {
        var list = settlementService.getAllVendorWallets();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/transactions")
    @Operation(summary = "Get all vendor wallet transactions paginated")
    public ResponseEntity<ApiResponse<Page<WalletTransactionDto>>> getAllTransactions(
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<WalletTransactionDto> page = settlementService.getAllTransactionsAdmin(pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    // Enterprise Settlements Queue
    @GetMapping("/queue")
    @Operation(summary = "Get settlements queue paginated by status (e.g. ELIGIBILITY_EVALUATION, ELIGIBLE, ON_HOLD, SETTLED)")
    public ResponseEntity<ApiResponse<Page<SettlementResponseDto>>> getSettlementsQueue(
            @RequestParam(required = false) SettlementStatus status,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<SettlementResponseDto> queue = settlementService.getSettlementsQueue(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(queue));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get detailed settlement record by ID with item breakdowns")
    public ResponseEntity<ApiResponse<SettlementResponseDto>> getSettlementById(@PathVariable UUID id) {
        SettlementResponseDto dto = settlementService.getSettlementById(id);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Manually approve an eligible settlement")
    public ResponseEntity<ApiResponse<SettlementResponseDto>> approveSettlement(@PathVariable UUID id, Authentication auth) {
        SettlementResponseDto dto = settlementService.approveSettlement(id, auth.getName());
        return ResponseEntity.ok(ApiResponse.success(dto, "Settlement approved and released to vendor payable balance"));
    }

    @PostMapping("/{id}/hold")
    @Operation(summary = "Place a settlement on administrative or dispute hold")
    public ResponseEntity<ApiResponse<SettlementResponseDto>> holdSettlement(
            @PathVariable UUID id,
            @RequestParam String reason,
            Authentication auth
    ) {
        SettlementResponseDto dto = settlementService.holdSettlement(id, reason, auth.getName());
        return ResponseEntity.ok(ApiResponse.success(dto, "Settlement placed on administrative hold"));
    }

    @PostMapping("/{id}/release-hold")
    @Operation(summary = "Release administrative hold on settlement")
    public ResponseEntity<ApiResponse<SettlementResponseDto>> releaseHold(@PathVariable UUID id, Authentication auth) {
        SettlementResponseDto dto = settlementService.releaseSettlementHold(id, auth.getName());
        return ResponseEntity.ok(ApiResponse.success(dto, "Administrative hold released"));
    }

    // Policies, Rate Cards & Tax Rules
    @GetMapping("/policies")
    @Operation(summary = "Get all configured settlement policies")
    public ResponseEntity<ApiResponse<List<SettlementPolicyDto>>> getPolicies() {
        return ResponseEntity.ok(ApiResponse.success(settlementService.getAllPolicies()));
    }

    @PutMapping("/policies/{id}")
    @Operation(summary = "Update settlement policy return window or auto-approval")
    public ResponseEntity<ApiResponse<SettlementPolicyDto>> updatePolicy(@PathVariable UUID id, @RequestBody SettlementPolicyDto dto) {
        return ResponseEntity.ok(ApiResponse.success(settlementService.updatePolicy(id, dto)));
    }

    @GetMapping("/rate-cards")
    @Operation(summary = "Get all settlement rate cards")
    public ResponseEntity<ApiResponse<List<SettlementRateCardDto>>> getRateCards() {
        return ResponseEntity.ok(ApiResponse.success(settlementService.getAllRateCards()));
    }

    @GetMapping("/tax-rules")
    @Operation(summary = "Get all statutory tax withholding rules")
    public ResponseEntity<ApiResponse<List<SettlementTaxRuleDto>>> getTaxRules() {
        return ResponseEntity.ok(ApiResponse.success(settlementService.getAllTaxRules()));
    }

    // Debt Recoveries & Manual Adjustments
    @GetMapping("/recoveries")
    @Operation(summary = "Get all vendor debt recovery records")
    public ResponseEntity<ApiResponse<Page<VendorDebtRecoveryDto>>> getRecoveries(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(vendorRecoveryService.getAllRecoveriesAdmin(pageable)));
    }

    @PostMapping("/adjustments")
    @Operation(summary = "Apply audited manual adjustment to vendor ledger")
    public ResponseEntity<ApiResponse<SettlementAdjustment>> createManualAdjustment(
            @Valid @RequestBody ManualAdjustmentRequest request,
            Authentication auth
    ) {
        SettlementAdjustment adj = vendorRecoveryService.applyManualAdjustment(
                request.getVendorId(),
                request.getSettlementId(),
                request.getAdjustmentType(),
                request.getAmount(),
                request.getReason(),
                auth.getName()
        );
        return ResponseEntity.ok(ApiResponse.success(adj, "Manual adjustment successfully applied and ledger updated"));
    }

    // Reconciliation Engine
    @GetMapping("/reconciliation")
    @Operation(summary = "Get reconciliation audit records")
    public ResponseEntity<ApiResponse<Page<ReconciliationRecordDto>>> getReconciliationRecords(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(reconciliationService.getReconciliationAuditTrail(status, pageable)));
    }

    @PostMapping("/reconciliation/gateway")
    @Operation(summary = "Run payment gateway vs escrow ledger reconciliation check")
    public ResponseEntity<ApiResponse<ReconciliationRecordDto>> runGatewayReconciliation() {
        return ResponseEntity.ok(ApiResponse.success(reconciliationService.runEscrowGatewayReconciliation()));
    }

    @PostMapping("/reconciliation/payouts")
    @Operation(summary = "Run bank settlement vs payout ledger reconciliation check")
    public ResponseEntity<ApiResponse<ReconciliationRecordDto>> runPayoutReconciliation() {
        return ResponseEntity.ok(ApiResponse.success(reconciliationService.runPayoutBankReconciliation()));
    }
}
