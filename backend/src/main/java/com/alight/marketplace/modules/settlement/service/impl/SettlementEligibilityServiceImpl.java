package com.alight.marketplace.modules.settlement.service.impl;

import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.order.entity.OrderItem;
import com.alight.marketplace.modules.order.entity.VendorOrder;
import com.alight.marketplace.modules.returns.entity.RmaRequest;
import com.alight.marketplace.modules.returns.entity.RmaStatus;
import com.alight.marketplace.modules.returns.repository.RmaRequestRepository;
import com.alight.marketplace.modules.settlement.entity.*;
import com.alight.marketplace.modules.settlement.repository.*;
import com.alight.marketplace.modules.settlement.service.RateCardResolverService;
import com.alight.marketplace.modules.settlement.service.SettlementEligibilityService;
import com.alight.marketplace.modules.settlement.service.VendorRecoveryService;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SettlementEligibilityServiceImpl implements SettlementEligibilityService {

    private final SettlementRepository settlementRepository;
    private final SettlementPolicyRepository policyRepository;
    private final SettlementItemRepository itemRepository;
    private final RateCardResolverService rateCardResolver;
    private final VendorRecoveryService vendorRecoveryService;
    private final VendorWalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final RmaRequestRepository rmaRequestRepository;

    @Override
    public SettlementPolicy resolvePolicy(VendorOrder vendorOrder) {
        if (vendorOrder.getVendor() != null) {
            var vPolicy = policyRepository.findByScopeAndScopeIdAndIsActiveTrue("VENDOR", vendorOrder.getVendor().getId());
            if (vPolicy.isPresent()) return vPolicy.get();
        }

        if (vendorOrder.getItems() != null && !vendorOrder.getItems().isEmpty()) {
            var firstItem = vendorOrder.getItems().get(0);
            if (firstItem.getProduct() != null && firstItem.getProduct().getCategory() != null) {
                var cPolicy = policyRepository.findByScopeAndScopeIdAndIsActiveTrue("CATEGORY", firstItem.getProduct().getCategory().getId());
                if (cPolicy.isPresent()) return cPolicy.get();
            }
        }

        return policyRepository.findFirstByScopeAndIsActiveTrue("MARKETPLACE_DEFAULT")
                .orElseGet(() -> SettlementPolicy.builder()
                        .policyName("Default 7-Day Settlement Policy")
                        .scope("MARKETPLACE_DEFAULT")
                        .returnWindowDays(7)
                        .autoApprovalEnabled(true)
                        .holdDisputedOrders(true)
                        .coolingPeriodHours(0)
                        .isActive(true)
                        .build());
    }

    @Override
    @Transactional
    public Settlement evaluateAndScheduleSettlement(VendorOrder vendorOrder) {
        var existing = settlementRepository.findByVendorOrderId(vendorOrder.getId());
        if (existing.isPresent()) {
            return existing.get();
        }

        Vendor vendor = vendorOrder.getVendor();
        SettlementPolicy policy = resolvePolicy(vendorOrder);
        SettlementRateCard rateCard = rateCardResolver.resolveRateCard(vendorOrder);
        SettlementTaxRule taxRule = rateCardResolver.resolveTaxRule(vendorOrder);

        BigDecimal gross = vendorOrder.getGrandTotal() != null ? vendorOrder.getGrandTotal() : (vendorOrder.getSubtotal() != null ? vendorOrder.getSubtotal() : BigDecimal.ZERO);
        BigDecimal subtotal = vendorOrder.getSubtotal() != null && vendorOrder.getSubtotal().compareTo(BigDecimal.ZERO) > 0 ? vendorOrder.getSubtotal() : gross;

        BigDecimal commRate = rateCard.getCommissionRate() != null ? rateCard.getCommissionRate() : new BigDecimal("10.00");
        BigDecimal commission = subtotal.multiply(commRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

        BigDecimal logisticsFee = rateCard.getLogisticsFeeFixed() != null ? rateCard.getLogisticsFeeFixed() : BigDecimal.ZERO;
        BigDecimal gatewayFee = rateCard.getPaymentGatewayFeePercent() != null && rateCard.getPaymentGatewayFeePercent().compareTo(BigDecimal.ZERO) > 0
                ? gross.multiply(rateCard.getPaymentGatewayFeePercent()).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal marketplaceFee = rateCard.getMarketplaceFixedFee() != null ? rateCard.getMarketplaceFixedFee() : BigDecimal.ZERO;

        BigDecimal taxRate = taxRule.getRatePercentage() != null ? taxRule.getRatePercentage() : new BigDecimal("1.00");
        BigDecimal taxWithholding = subtotal.multiply(taxRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

        BigDecimal netPayable = gross.subtract(commission)
                .subtract(logisticsFee)
                .subtract(gatewayFee)
                .subtract(marketplaceFee)
                .subtract(taxWithholding);
        if (netPayable.compareTo(BigDecimal.ZERO) < 0) netPayable = BigDecimal.ZERO;

        Instant deliveredAt = vendorOrder.getDeliveredAt() != null ? vendorOrder.getDeliveredAt() : Instant.now();
        Instant eligibleAt = deliveredAt.plus(policy.getReturnWindowDays(), ChronoUnit.DAYS).plus(policy.getCoolingPeriodHours(), ChronoUnit.HOURS);

        // Check open RMAs
        List<RmaRequest> activeRmas = rmaRequestRepository.findByVendorOrderId(vendorOrder.getId()).stream()
                .filter(r -> r.getStatus() != RmaStatus.CANCELLED && r.getStatus() != RmaStatus.REJECTED && r.getStatus() != RmaStatus.REFUND_PROCESSED)
                .toList();

        SettlementStatus initialStatus = SettlementStatus.ELIGIBILITY_EVALUATION;
        String holdReason = null;

        if (!activeRmas.isEmpty() && Boolean.TRUE.equals(policy.getHoldDisputedOrders())) {
            initialStatus = SettlementStatus.ON_HOLD;
            holdReason = "Open RMA return/dispute active: " + activeRmas.get(0).getRmaNumber();
        } else if (Instant.now().isAfter(eligibleAt) || policy.getReturnWindowDays() == 0) {
            initialStatus = SettlementStatus.ELIGIBLE;
        }

        String settleNum = "SET-" + Instant.now().getEpochSecond() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        String snapshot = String.format("{\"rateCard\":\"%s\",\"rateCardVersion\":\"%s\",\"commissionRate\":%s,\"taxRule\":\"%s\",\"taxRate\":%s,\"gross\":%s,\"net\":%s,\"policy\":\"%s\",\"returnWindowDays\":%d}",
                rateCard.getRateCardCode(), rateCard.getVersion(), commRate.toPlainString(),
                taxRule.getTaxRuleCode(), taxRate.toPlainString(), gross.toPlainString(), netPayable.toPlainString(),
                policy.getPolicyName(), policy.getReturnWindowDays());

        Settlement settlement = Settlement.builder()
                .settlementNumber(settleNum)
                .vendor(vendor)
                .masterOrder(vendorOrder.getMasterOrder())
                .vendorOrder(vendorOrder)
                .status(initialStatus)
                .holdReason(holdReason)
                .grossAmount(gross)
                .platformCommission(commission)
                .logisticsDeduction(logisticsFee)
                .paymentFeeDeduction(gatewayFee)
                .marketplaceFee(marketplaceFee)
                .taxWithholdingAmount(taxWithholding)
                .netPayableAmount(netPayable)
                .currencyCode(vendorOrder.getMasterOrder() != null && vendorOrder.getMasterOrder().getCurrencyCode() != null ? vendorOrder.getMasterOrder().getCurrencyCode() : "INR")
                .rateCard(rateCard)
                .rateCardVersion(rateCard.getVersion())
                .taxRule(taxRule)
                .taxRuleVersion(taxRule.getVersion())
                .eligibleAt(eligibleAt)
                .calculationSnapshot(snapshot)
                .build();

        settlement = settlementRepository.save(settlement);

        // Create Item-level records
        if (vendorOrder.getItems() != null) {
            for (OrderItem oi : vendorOrder.getItems()) {
                BigDecimal itemGross = oi.getGrandTotal() != null ? oi.getGrandTotal() : BigDecimal.ZERO;
                BigDecimal itemSubtotal = oi.getSubtotal() != null ? oi.getSubtotal() : itemGross;
                BigDecimal itemComm = itemSubtotal.multiply(commRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                BigDecimal itemTax = itemSubtotal.multiply(taxRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                BigDecimal itemNet = itemGross.subtract(itemComm).subtract(itemTax);
                if (itemNet.compareTo(BigDecimal.ZERO) < 0) itemNet = BigDecimal.ZERO;

                SettlementItem sItem = SettlementItem.builder()
                        .settlement(settlement)
                        .orderItem(oi)
                        .quantity(oi.getQuantity())
                        .grossAmount(itemGross)
                        .commissionAmount(itemComm)
                        .taxAmount(itemTax)
                        .netAmount(itemNet)
                        .status("ELIGIBILITY_EVALUATION")
                        .build();
                itemRepository.save(sItem);
            }
        }

        // If instantly eligible and policy allows auto-approval, execute settlement release
        if (initialStatus == SettlementStatus.ELIGIBLE && Boolean.TRUE.equals(policy.getAutoApprovalEnabled())) {
            settleAndCreditVendor(settlement);
        }

        log.info("Evaluated settlement {} for sub-order {} -> Status: {}, Eligible at: {}",
                settleNum, vendorOrder.getSubOrderNumber(), initialStatus, eligibleAt);
        return settlement;
    }

    @Override
    @Transactional
    public List<Settlement> processMaturedSettlements() {
        List<Settlement> matured = settlementRepository.findReadyForAutoApproval(SettlementStatus.ELIGIBILITY_EVALUATION)
                .stream()
                .filter(s -> s.getEligibleAt() != null && Instant.now().isAfter(s.getEligibleAt()))
                .toList();

        List<Settlement> processed = new ArrayList<>();
        for (Settlement s : matured) {
            try {
                settleAndCreditVendor(s);
                processed.add(s);
            } catch (Exception ex) {
                log.error("Failed to auto-settle matured settlement {}: {}", s.getSettlementNumber(), ex.getMessage());
            }
        }
        return processed;
    }

    @Override
    @Transactional
    public Settlement holdSettlement(UUID settlementId, String reason, String actorEmail) {
        Settlement s = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement not found"));
        s.setStatus(SettlementStatus.ON_HOLD);
        s.setHoldReason("Administrative hold placed by " + actorEmail + ": " + reason);
        return settlementRepository.save(s);
    }

    @Override
    @Transactional
    public Settlement releaseHold(UUID settlementId, String actorEmail) {
        Settlement s = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement not found"));
        s.setHoldReason(null);
        if (s.getEligibleAt() != null && Instant.now().isAfter(s.getEligibleAt())) {
            s.setStatus(SettlementStatus.ELIGIBLE);
            settleAndCreditVendor(s);
        } else {
            s.setStatus(SettlementStatus.ELIGIBILITY_EVALUATION);
            settlementRepository.save(s);
        }
        log.info("Hold released on settlement {} by {}", s.getSettlementNumber(), actorEmail);
        return s;
    }

    private void settleAndCreditVendor(Settlement s) {
        Vendor vendor = s.getVendor();
        VendorWallet wallet = walletRepository.findByVendorId(vendor.getId())
                .orElseGet(() -> walletRepository.save(VendorWallet.builder().vendor(vendor).build()));

        // Idempotency check: if already settled or transaction exists
        if (s.getStatus() == SettlementStatus.SETTLED ||
                transactionRepository.existsByIdempotencyKey("SETTLE_RELEASE_" + s.getSettlementNumber())) {
            log.info("Settlement {} already finalized", s.getSettlementNumber());
            return;
        }

        BigDecimal gross = s.getGrossAmount();
        BigDecimal netBeforeClawback = s.getNetPayableAmount();

        // Claw back any outstanding vendor debt from this settlement
        BigDecimal netToCredit = vendorRecoveryService.clawbackFromSettlement(vendor, netBeforeClawback);

        // Deduct from pending escrow (up to available pending balance)
        BigDecimal pendingDeduct = wallet.getPendingBalance().min(gross);
        wallet.setPendingBalance(wallet.getPendingBalance().subtract(pendingDeduct));

        // Credit net payable to available balance
        wallet.setAvailableBalance(wallet.getAvailableBalance().add(netToCredit));
        wallet.setTotalCommissionPaid(wallet.getTotalCommissionPaid().add(s.getPlatformCommission()));
        wallet.setTotalTcsPaid(wallet.getTotalTcsPaid().add(s.getTaxWithholdingAmount()));
        walletRepository.save(wallet);

        s.setStatus(SettlementStatus.SETTLED);
        s.setApprovedAt(Instant.now());
        s.setSettledAt(Instant.now());
        settlementRepository.save(s);

        // Double-entry ledger records
        String idempKey = "SETTLE_RELEASE_" + s.getSettlementNumber();
        WalletTransaction releaseTx = WalletTransaction.builder()
                .wallet(wallet)
                .vendor(vendor)
                .vendorOrder(s.getVendorOrder())
                .settlementId(s.getId())
                .transactionType(WalletTransactionType.ESCROW_RELEASE)
                .amount(netToCredit)
                .creditAmount(netToCredit)
                .debitAmount(BigDecimal.ZERO)
                .currencyCode(s.getCurrencyCode())
                .idempotencyKey(idempKey)
                .balanceType("AVAILABLE")
                .balanceAfter(wallet.getAvailableBalance())
                .description("Settlement release for " + s.getSettlementNumber() + " (Sub-Order " + s.getVendorOrder().getSubOrderNumber() + ")")
                .referenceId(s.getSettlementNumber())
                .build();
        transactionRepository.save(releaseTx);

        if (s.getPlatformCommission().compareTo(BigDecimal.ZERO) > 0) {
            WalletTransaction commTx = WalletTransaction.builder()
                    .wallet(wallet)
                    .vendor(vendor)
                    .vendorOrder(s.getVendorOrder())
                    .settlementId(s.getId())
                    .transactionType(WalletTransactionType.COMMISSION_DEDUCTION)
                    .amount(s.getPlatformCommission())
                    .creditAmount(BigDecimal.ZERO)
                    .debitAmount(s.getPlatformCommission())
                    .currencyCode(s.getCurrencyCode())
                    .idempotencyKey("COMM_" + s.getSettlementNumber())
                    .balanceType("AVAILABLE")
                    .balanceAfter(wallet.getAvailableBalance())
                    .description("Platform commission fee deduction for " + s.getSettlementNumber())
                    .referenceId(s.getSettlementNumber())
                    .build();
            transactionRepository.save(commTx);
        }

        if (s.getTaxWithholdingAmount().compareTo(BigDecimal.ZERO) > 0) {
            WalletTransaction taxTx = WalletTransaction.builder()
                    .wallet(wallet)
                    .vendor(vendor)
                    .vendorOrder(s.getVendorOrder())
                    .settlementId(s.getId())
                    .transactionType(WalletTransactionType.TCS_DEDUCTION)
                    .amount(s.getTaxWithholdingAmount())
                    .creditAmount(BigDecimal.ZERO)
                    .debitAmount(s.getTaxWithholdingAmount())
                    .currencyCode(s.getCurrencyCode())
                    .idempotencyKey("TCS_" + s.getSettlementNumber())
                    .balanceType("AVAILABLE")
                    .balanceAfter(wallet.getAvailableBalance())
                    .description("Statutory GST TCS deduction for " + s.getSettlementNumber())
                    .referenceId(s.getSettlementNumber())
                    .build();
            transactionRepository.save(taxTx);
        }

        log.info("Finalized settlement {} for vendor {}. Net credited: {}", s.getSettlementNumber(), vendor.getStoreName(), netToCredit);
    }
}
