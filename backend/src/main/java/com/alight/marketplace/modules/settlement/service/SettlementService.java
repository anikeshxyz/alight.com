package com.alight.marketplace.modules.settlement.service;

import com.alight.marketplace.modules.order.entity.VendorOrder;
import com.alight.marketplace.modules.settlement.dto.*;
import com.alight.marketplace.modules.settlement.entity.PayoutStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface SettlementService {

    void holdInEscrow(VendorOrder vendorOrder);

    void releaseEscrow(UUID vendorOrderId);

    void refundEscrow(VendorOrder vendorOrder, BigDecimal refundAmount);

    VendorWalletDto getWalletForCurrentUser(String email);

    VendorWalletDto updateBankDetails(String email, BankDetailsDto dto);

    VendorPayoutDto requestPayout(String email, PayoutRequestDto dto);

    Page<WalletTransactionDto> getVendorTransactions(String email, Pageable pageable);

    Page<VendorPayoutDto> getVendorPayouts(String email, Pageable pageable);

    SettlementOverviewDto getAdminOverview();

    List<DeliveredSettlementDto> getDeliveredSettlements();

    List<VendorWalletDto> getAllVendorWallets();

    Page<WalletTransactionDto> getAllTransactionsAdmin(Pageable pageable);

    Page<VendorPayoutDto> getAdminPayouts(PayoutStatus status, Pageable pageable);

    VendorPayoutDto approvePayout(UUID payoutId, String utrNumber, String adminNotes);

    VendorPayoutDto rejectPayout(UUID payoutId, String rejectionReason, String adminNotes);

    // Enterprise Settlements & Policies
    Page<SettlementResponseDto> getSettlementsQueue(com.alight.marketplace.modules.settlement.entity.SettlementStatus status, Pageable pageable);

    SettlementResponseDto getSettlementById(UUID id);

    Page<SettlementResponseDto> getVendorSettlements(String email, Pageable pageable);

    List<SettlementPolicyDto> getAllPolicies();

    SettlementPolicyDto updatePolicy(UUID id, SettlementPolicyDto dto);

    List<SettlementRateCardDto> getAllRateCards();

    List<SettlementTaxRuleDto> getAllTaxRules();

    SettlementResponseDto approveSettlement(UUID settlementId, String adminEmail);

    SettlementResponseDto holdSettlement(UUID settlementId, String reason, String adminEmail);

    SettlementResponseDto releaseSettlementHold(UUID settlementId, String adminEmail);
}
