package com.alight.marketplace.modules.settlement.service.impl;

import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.returns.entity.RmaRequest;
import com.alight.marketplace.modules.settlement.dto.VendorDebtRecoveryDto;
import com.alight.marketplace.modules.settlement.entity.*;
import com.alight.marketplace.modules.settlement.repository.*;
import com.alight.marketplace.modules.settlement.service.VendorRecoveryService;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VendorRecoveryServiceImpl implements VendorRecoveryService {

    private final VendorRepository vendorRepository;
    private final VendorWalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final SettlementRepository settlementRepository;
    private final SettlementAdjustmentRepository adjustmentRepository;
    private final VendorDebtRecoveryRepository debtRecoveryRepository;

    @Override
    @Transactional
    public SettlementAdjustment applyPostSettlementReturnDebit(RmaRequest rma, BigDecimal netRefundAmount, String actorEmail) {
        Vendor vendor = rma.getVendor();
        VendorWallet wallet = getOrCreateWallet(vendor);

        Settlement settlement = settlementRepository.findByVendorOrderId(rma.getVendorOrder().getId()).orElse(null);

        String adjNumber = "ADJ-" + Instant.now().getEpochSecond() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        SettlementAdjustment adj = SettlementAdjustment.builder()
                .adjustmentNumber(adjNumber)
                .settlement(settlement)
                .vendor(vendor)
                .rma(rma)
                .adjustmentType("RETURN_REFUND")
                .amount(netRefundAmount)
                .reason("Post-settlement return refund for RMA " + rma.getRmaNumber() + " on sub-order " + rma.getVendorOrder().getSubOrderNumber())
                .createdBy(actorEmail)
                .status("APPLIED")
                .build();

        adj = adjustmentRepository.save(adj);

        // Check liquid available balance
        BigDecimal avail = wallet.getAvailableBalance();
        if (avail.compareTo(netRefundAmount) >= 0) {
            // Full deduction from available balance
            wallet.setAvailableBalance(avail.subtract(netRefundAmount));
            walletRepository.save(wallet);

            recordTransaction(wallet, vendor, adj.getAdjustmentType(), netRefundAmount, BigDecimal.ZERO, netRefundAmount,
                    "Post-settlement return debit for RMA " + rma.getRmaNumber(), adjNumber, "ADJ_TX_" + adjNumber);
        } else {
            // Partial deduction from available balance, balance goes to zero, rest recorded as recovery debt
            BigDecimal deductFromAvail = avail;
            BigDecimal unrecoveredDebt = netRefundAmount.subtract(deductFromAvail);

            wallet.setAvailableBalance(BigDecimal.ZERO);
            wallet.setRecoveryDueBalance(wallet.getRecoveryDueBalance().add(unrecoveredDebt));
            walletRepository.save(wallet);

            if (deductFromAvail.compareTo(BigDecimal.ZERO) > 0) {
                recordTransaction(wallet, vendor, adj.getAdjustmentType(), deductFromAvail, BigDecimal.ZERO, deductFromAvail,
                        "Partial return debit for RMA " + rma.getRmaNumber(), adjNumber, "ADJ_TX_PART_" + adjNumber);
            }

            // Create Debt Recovery Record
            String recRef = "REC-" + Instant.now().getEpochSecond() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            VendorDebtRecovery recovery = VendorDebtRecovery.builder()
                    .recoveryReference(recRef)
                    .vendor(vendor)
                    .adjustment(adj)
                    .originalAmount(unrecoveredDebt)
                    .recoveredAmount(BigDecimal.ZERO)
                    .remainingAmount(unrecoveredDebt)
                    .status("RECOVERY_PENDING")
                    .notes("Pending clawback for unrecovered post-settlement return on RMA " + rma.getRmaNumber())
                    .build();
            debtRecoveryRepository.save(recovery);

            recordTransaction(wallet, vendor, "DEBT_RECOVERY", unrecoveredDebt, BigDecimal.ZERO, unrecoveredDebt,
                    "Unrecovered return debt registered: " + recRef, recRef, "DEBT_REG_" + recRef);
            log.warn("Vendor {} had insufficient liquid balance. Registered {} in recovery debt {}", vendor.getStoreName(), unrecoveredDebt, recRef);
        }

        return adj;
    }

    @Override
    @Transactional
    public SettlementAdjustment applyManualAdjustment(UUID vendorId, UUID settlementId, String adjustmentType,
                                                      BigDecimal amount, String reason, String actorEmail) {
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));
        VendorWallet wallet = getOrCreateWallet(vendor);
        Settlement settlement = settlementId != null ? settlementRepository.findById(settlementId).orElse(null) : null;

        String adjNumber = "MAN-" + Instant.now().getEpochSecond() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        SettlementAdjustment adj = SettlementAdjustment.builder()
                .adjustmentNumber(adjNumber)
                .settlement(settlement)
                .vendor(vendor)
                .adjustmentType(adjustmentType)
                .amount(amount)
                .reason(reason)
                .createdBy(actorEmail)
                .status("APPLIED")
                .build();
        adj = adjustmentRepository.save(adj);

        if ("SELLER_CREDIT".equalsIgnoreCase(adjustmentType)) {
            wallet.setAvailableBalance(wallet.getAvailableBalance().add(amount));
            walletRepository.save(wallet);
            recordTransaction(wallet, vendor, adjustmentType, amount, amount, BigDecimal.ZERO,
                    "Manual credit: " + reason, adjNumber, "MAN_CREDIT_" + adjNumber);
        } else {
            // Debit or penalty
            BigDecimal avail = wallet.getAvailableBalance();
            if (avail.compareTo(amount) >= 0) {
                wallet.setAvailableBalance(avail.subtract(amount));
                walletRepository.save(wallet);
                recordTransaction(wallet, vendor, adjustmentType, amount, BigDecimal.ZERO, amount,
                        "Manual debit: " + reason, adjNumber, "MAN_DEBIT_" + adjNumber);
            } else {
                BigDecimal deductFromAvail = avail;
                BigDecimal unrecovered = amount.subtract(deductFromAvail);
                wallet.setAvailableBalance(BigDecimal.ZERO);
                wallet.setRecoveryDueBalance(wallet.getRecoveryDueBalance().add(unrecovered));
                walletRepository.save(wallet);

                if (deductFromAvail.compareTo(BigDecimal.ZERO) > 0) {
                    recordTransaction(wallet, vendor, adjustmentType, deductFromAvail, BigDecimal.ZERO, deductFromAvail,
                            "Partial manual debit: " + reason, adjNumber, "MAN_DEBIT_PART_" + adjNumber);
                }

                String recRef = "REC-MAN-" + Instant.now().getEpochSecond();
                VendorDebtRecovery recovery = VendorDebtRecovery.builder()
                        .recoveryReference(recRef)
                        .vendor(vendor)
                        .adjustment(adj)
                        .originalAmount(unrecovered)
                        .recoveredAmount(BigDecimal.ZERO)
                        .remainingAmount(unrecovered)
                        .status("RECOVERY_PENDING")
                        .notes("Unrecovered manual adjustment debt: " + reason)
                        .build();
                debtRecoveryRepository.save(recovery);
            }
        }

        return adj;
    }

    @Override
    @Transactional
    public BigDecimal clawbackFromSettlement(Vendor vendor, BigDecimal netSettlementCredit) {
        if (netSettlementCredit == null || netSettlementCredit.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        List<VendorDebtRecovery> pendingRecoveries = debtRecoveryRepository.findByVendorIdAndStatusIn(
                vendor.getId(), List.of("RECOVERY_PENDING", "RECOVERY_PARTIAL"));

        if (pendingRecoveries.isEmpty()) {
            return netSettlementCredit;
        }

        BigDecimal remainingCredit = netSettlementCredit;
        VendorWallet wallet = getOrCreateWallet(vendor);

        for (VendorDebtRecovery rec : pendingRecoveries) {
            if (remainingCredit.compareTo(BigDecimal.ZERO) <= 0) break;

            BigDecimal debtToRecover = rec.getRemainingAmount().min(remainingCredit);
            rec.setRecoveredAmount(rec.getRecoveredAmount().add(debtToRecover));
            rec.setRemainingAmount(rec.getRemainingAmount().subtract(debtToRecover));
            remainingCredit = remainingCredit.subtract(debtToRecover);

            if (rec.getRemainingAmount().compareTo(BigDecimal.ZERO) <= 0) {
                rec.setStatus("RECOVERY_COMPLETED");
            } else {
                rec.setStatus("RECOVERY_PARTIAL");
            }
            debtRecoveryRepository.save(rec);

            wallet.setRecoveryDueBalance(wallet.getRecoveryDueBalance().subtract(debtToRecover));

            recordTransaction(wallet, vendor, "DEBT_RECOVERY", debtToRecover, BigDecimal.ZERO, debtToRecover,
                    "Automatic debt recovery clawback: " + rec.getRecoveryReference(), rec.getRecoveryReference(),
                    "CLAWBACK_" + rec.getRecoveryReference() + "_" + Instant.now().toEpochMilli());

            log.info("Clawed back {} from settlement credit for vendor {} under debt recovery {}", debtToRecover, vendor.getStoreName(), rec.getRecoveryReference());
        }

        walletRepository.save(wallet);
        return remainingCredit;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VendorDebtRecoveryDto> getVendorRecoveries(UUID vendorId, Pageable pageable) {
        return debtRecoveryRepository.findByVendorIdOrderByCreatedAtDesc(vendorId, pageable)
                .map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VendorDebtRecoveryDto> getAllRecoveriesAdmin(Pageable pageable) {
        return debtRecoveryRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::mapToDto);
    }

    private void recordTransaction(VendorWallet wallet, Vendor vendor, String typeStr, BigDecimal amount,
                                   BigDecimal credit, BigDecimal debit, String desc, String refId, String idempKey) {
        WalletTransactionType txType = WalletTransactionType.ADJUSTMENT;
        try {
            txType = WalletTransactionType.valueOf(typeStr);
        } catch (Exception ignored) {}

        WalletTransaction tx = WalletTransaction.builder()
                .wallet(wallet)
                .vendor(vendor)
                .transactionType(txType)
                .amount(amount)
                .creditAmount(credit)
                .debitAmount(debit)
                .currencyCode(wallet.getCurrencyCode())
                .idempotencyKey(idempKey)
                .balanceType("AVAILABLE")
                .balanceAfter(wallet.getAvailableBalance())
                .description(desc)
                .referenceId(refId)
                .build();
        transactionRepository.save(tx);
    }

    private VendorWallet getOrCreateWallet(Vendor vendor) {
        return walletRepository.findByVendorId(vendor.getId())
                .orElseGet(() -> walletRepository.save(VendorWallet.builder()
                        .vendor(vendor)
                        .pendingBalance(BigDecimal.ZERO)
                        .availableBalance(BigDecimal.ZERO)
                        .reservedBalance(BigDecimal.ZERO)
                        .onHoldBalance(BigDecimal.ZERO)
                        .recoveryDueBalance(BigDecimal.ZERO)
                        .totalEarnings(BigDecimal.ZERO)
                        .totalWithdrawn(BigDecimal.ZERO)
                        .totalCommissionPaid(BigDecimal.ZERO)
                        .totalTcsPaid(BigDecimal.ZERO)
                        .currencyCode("INR")
                        .isPayoutEnabled(true)
                        .build()));
    }

    private VendorDebtRecoveryDto mapToDto(VendorDebtRecovery r) {
        return VendorDebtRecoveryDto.builder()
                .id(r.getId())
                .recoveryReference(r.getRecoveryReference())
                .vendorId(r.getVendor().getId())
                .vendorStoreName(r.getVendor().getStoreName())
                .adjustmentId(r.getAdjustment() != null ? r.getAdjustment().getId() : null)
                .originalAmount(r.getOriginalAmount())
                .recoveredAmount(r.getRecoveredAmount())
                .remainingAmount(r.getRemainingAmount())
                .status(r.getStatus())
                .notes(r.getNotes())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
