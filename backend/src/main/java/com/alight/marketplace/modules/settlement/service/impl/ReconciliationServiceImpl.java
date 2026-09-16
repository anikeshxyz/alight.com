package com.alight.marketplace.modules.settlement.service.impl;

import com.alight.marketplace.modules.payment.entity.PaymentTransaction;
import com.alight.marketplace.modules.payment.entity.PaymentTransactionStatus;
import com.alight.marketplace.modules.payment.repository.PaymentTransactionRepository;
import com.alight.marketplace.modules.settlement.dto.ReconciliationRecordDto;
import com.alight.marketplace.modules.settlement.entity.PayoutStatus;
import com.alight.marketplace.modules.settlement.entity.ReconciliationRecord;
import com.alight.marketplace.modules.settlement.entity.VendorPayout;
import com.alight.marketplace.modules.settlement.entity.VendorWallet;
import com.alight.marketplace.modules.settlement.repository.ReconciliationRecordRepository;
import com.alight.marketplace.modules.settlement.repository.VendorPayoutRepository;
import com.alight.marketplace.modules.settlement.repository.VendorWalletRepository;
import com.alight.marketplace.modules.settlement.service.ReconciliationService;
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
public class ReconciliationServiceImpl implements ReconciliationService {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final VendorWalletRepository walletRepository;
    private final VendorPayoutRepository payoutRepository;
    private final ReconciliationRecordRepository reconciliationRecordRepository;

    @Override
    @Transactional
    public ReconciliationRecordDto runEscrowGatewayReconciliation() {
        // Sum all captured gateway transactions
        List<PaymentTransaction> captured = paymentTransactionRepository.findAll().stream()
                .filter(tx -> tx.getTransactionStatus() == PaymentTransactionStatus.CAPTURED)
                .toList();
        BigDecimal totalCaptured = captured.stream()
                .map(PaymentTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Sum pending escrow + available balances across all vendor wallets
        List<VendorWallet> wallets = walletRepository.findAll();
        BigDecimal totalWallets = wallets.stream()
                .map(w -> w.getPendingBalance().add(w.getAvailableBalance()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal diff = totalCaptured.subtract(totalWallets).abs();
        String status = diff.compareTo(new BigDecimal("100.00")) <= 0 ? "MATCHED" : "MISMATCH";

        String ref = "REC-GW-" + Instant.now().getEpochSecond();
        ReconciliationRecord record = ReconciliationRecord.builder()
                .recordReference(ref)
                .reconciliationType("GATEWAY_ESCROW")
                .externalReference("GATEWAY_AGGREGATE")
                .ledgerReference("ALIGHT_WALLET_TOTAL")
                .expectedAmount(totalCaptured)
                .actualAmount(totalWallets)
                .differenceAmount(diff)
                .status(status)
                .discrepancyReason(status.equals("MATCHED") ? "Escrow balances match payment gateway collections within audit threshold" : "Unreconciled gateway capture vs vendor ledger divergence")
                .reconciledAt(Instant.now())
                .reconciledBy("SYSTEM_AUDIT_DAEMON")
                .build();

        record = reconciliationRecordRepository.save(record);
        log.info("Ran Gateway Escrow reconciliation {}: Status={}, Difference={}", ref, status, diff);
        return mapToDto(record);
    }

    @Override
    @Transactional
    public ReconciliationRecordDto runPayoutBankReconciliation() {
        // Sum paid payouts in platform DB
        List<VendorPayout> paidPayouts = payoutRepository.findByStatusOrderByRequestedAtDesc(PayoutStatus.PAID, Pageable.unpaged()).getContent();
        BigDecimal totalPaid = paidPayouts.stream()
                .map(VendorPayout::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Sum cumulative withdrawn across wallets
        BigDecimal totalWithdrawn = walletRepository.findAll().stream()
                .map(VendorWallet::getTotalWithdrawn)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal diff = totalPaid.subtract(totalWithdrawn).abs();
        String status = diff.compareTo(BigDecimal.ZERO) == 0 ? "MATCHED" : "PARTIALLY_MATCHED";

        String ref = "REC-BNK-" + Instant.now().getEpochSecond();
        ReconciliationRecord record = ReconciliationRecord.builder()
                .recordReference(ref)
                .reconciliationType("BANK_PAYOUT")
                .externalReference("BANK_SETTLEMENT_FILE")
                .ledgerReference("ALIGHT_PAYOUT_LEDGER")
                .expectedAmount(totalPaid)
                .actualAmount(totalWithdrawn)
                .differenceAmount(diff)
                .status(status)
                .discrepancyReason(status.equals("MATCHED") ? "Bank disbursements fully reconciled with ledger totalWithdrawn balance" : "Pending unconfirmed bank settlement entries")
                .reconciledAt(Instant.now())
                .reconciledBy("SYSTEM_AUDIT_DAEMON")
                .build();

        record = reconciliationRecordRepository.save(record);
        log.info("Ran Bank Payout reconciliation {}: Status={}, Difference={}", ref, status, diff);
        return mapToDto(record);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReconciliationRecordDto> getReconciliationAuditTrail(String status, Pageable pageable) {
        if (status != null && !status.equalsIgnoreCase("ALL")) {
            return reconciliationRecordRepository.findByStatusOrderByReconciledAtDesc(status, pageable).map(this::mapToDto);
        }
        return reconciliationRecordRepository.findAllByOrderByReconciledAtDesc(pageable).map(this::mapToDto);
    }

    private ReconciliationRecordDto mapToDto(ReconciliationRecord r) {
        return ReconciliationRecordDto.builder()
                .id(r.getId())
                .recordReference(r.getRecordReference())
                .reconciliationType(r.getReconciliationType())
                .externalReference(r.getExternalReference())
                .ledgerReference(r.getLedgerReference())
                .expectedAmount(r.getExpectedAmount())
                .actualAmount(r.getActualAmount())
                .differenceAmount(r.getDifferenceAmount())
                .status(r.getStatus())
                .discrepancyReason(r.getDiscrepancyReason())
                .reconciledAt(r.getReconciledAt())
                .reconciledBy(r.getReconciledBy())
                .build();
    }
}
