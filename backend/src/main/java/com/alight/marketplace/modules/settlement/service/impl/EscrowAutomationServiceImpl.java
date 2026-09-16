package com.alight.marketplace.modules.settlement.service.impl;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.order.entity.FulfillmentStatus;
import com.alight.marketplace.modules.order.entity.VendorOrder;
import com.alight.marketplace.modules.order.repository.VendorOrderRepository;
import com.alight.marketplace.modules.settlement.dto.AutoSettlementResultDTO;
import com.alight.marketplace.modules.settlement.dto.CreatePayoutBatchRequest;
import com.alight.marketplace.modules.settlement.dto.PayoutBatchDTO;
import com.alight.marketplace.modules.settlement.entity.PayoutBatch;
import com.alight.marketplace.modules.settlement.entity.PayoutStatus;
import com.alight.marketplace.modules.settlement.entity.VendorPayout;
import com.alight.marketplace.modules.settlement.repository.PayoutBatchRepository;
import com.alight.marketplace.modules.settlement.repository.VendorPayoutRepository;
import com.alight.marketplace.modules.settlement.service.EscrowAutomationService;
import com.alight.marketplace.modules.settlement.service.SettlementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EscrowAutomationServiceImpl implements EscrowAutomationService {

    private final VendorOrderRepository vendorOrderRepository;
    private final SettlementService settlementService;
    private final com.alight.marketplace.modules.settlement.service.SettlementEligibilityService eligibilityService;
    private final PayoutBatchRepository batchRepository;
    private final VendorPayoutRepository payoutRepository;

    @Override
    @Transactional
    public AutoSettlementResultDTO runAutoSettlementForDeliveredOrders() {
        // 1. Process all matured settlements whose return window has elapsed
        List<com.alight.marketplace.modules.settlement.entity.Settlement> matured = eligibilityService.processMaturedSettlements();

        // 2. Evaluate any newly delivered sub-orders
        List<VendorOrder> deliveredOrders = vendorOrderRepository.findByFulfillmentStatus(FulfillmentStatus.DELIVERED);

        List<String> settled = new ArrayList<>();
        BigDecimal totalReleased = BigDecimal.ZERO;
        BigDecimal totalCommission = BigDecimal.ZERO;
        BigDecimal totalTcs = BigDecimal.ZERO;

        for (var s : matured) {
            settled.add(s.getSettlementNumber());
            totalReleased = totalReleased.add(s.getNetPayableAmount());
            totalCommission = totalCommission.add(s.getPlatformCommission());
            totalTcs = totalTcs.add(s.getTaxWithholdingAmount());
        }

        for (VendorOrder order : deliveredOrders) {
            try {
                var s = eligibilityService.evaluateAndScheduleSettlement(order);
                if (s != null && s.getStatus() == com.alight.marketplace.modules.settlement.entity.SettlementStatus.SETTLED && !settled.contains(s.getSettlementNumber())) {
                    settled.add(s.getSettlementNumber());
                    totalReleased = totalReleased.add(s.getNetPayableAmount());
                    totalCommission = totalCommission.add(s.getPlatformCommission());
                    totalTcs = totalTcs.add(s.getTaxWithholdingAmount());
                }
            } catch (Exception ex) {
                log.warn("Order {} already evaluated or failed: {}", order.getSubOrderNumber(), ex.getMessage());
            }
        }

        String msg = String.format("Auto-settlement processed: %d orders evaluated/settled, Total released: %s",
                settled.size(), totalReleased.toPlainString());
        log.info(msg);

        return AutoSettlementResultDTO.builder()
                .ordersProcessed(deliveredOrders.size())
                .ordersSettled(settled.size())
                .totalAmountReleased(totalReleased)
                .totalCommissionDeducted(totalCommission)
                .totalTcsDeducted(totalTcs)
                .settledOrderNumbers(settled)
                .message(msg)
                .build();
    }

    @Override
    @Transactional
    public PayoutBatchDTO createPayoutBatch(CreatePayoutBatchRequest request) {
        if (request.getPayoutIds() == null || request.getPayoutIds().isEmpty()) {
            throw new BadRequestException("At least one payout ID is required to form a batch");
        }

        List<VendorPayout> payouts = payoutRepository.findAllById(request.getPayoutIds());
        if (payouts.isEmpty()) {
            throw new BadRequestException("No valid payouts found for provided IDs");
        }

        String batchRef = "PB-" + Instant.now().getEpochSecond() + "-" + (int)(Math.random() * 900 + 100);
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (VendorPayout p : payouts) {
            totalAmount = totalAmount.add(p.getAmount());
            p.setStatus(PayoutStatus.PROCESSING);
        }

        PayoutBatch batch = PayoutBatch.builder()
                .batchReference(batchRef)
                .totalAmount(totalAmount)
                .currencyCode(payouts.get(0).getCurrencyCode())
                .payoutCount(payouts.size())
                .status(PayoutStatus.PROCESSING)
                .notes(request.getNotes())
                .build();

        batch = batchRepository.save(batch);

        for (VendorPayout p : payouts) {
            p.setBatch(batch);
            payoutRepository.save(p);
        }

        log.info("Created payout batch {} with {} payouts, total amount: {}", batchRef, payouts.size(), totalAmount);
        return PayoutBatchDTO.fromEntity(batch);
    }

    @Override
    @Transactional
    public PayoutBatchDTO processPayoutBatch(UUID batchId, String bankBatchId) {
        PayoutBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Payout batch not found: " + batchId));

        batch.setStatus(PayoutStatus.PAID);
        batch.setBankBatchId(bankBatchId != null ? bankBatchId : "BANK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        batch.setProcessedAt(Instant.now());

        if (batch.getPayouts() != null) {
            for (VendorPayout p : batch.getPayouts()) {
                p.setStatus(PayoutStatus.PAID);
                p.setProcessedAt(Instant.now());
                if (p.getUtrNumber() == null) {
                    p.setUtrNumber("UTR-" + batch.getBankBatchId() + "-" + p.getPayoutReference());
                }
                payoutRepository.save(p);
            }
        }

        batch = batchRepository.save(batch);
        log.info("Processed and paid batch {} via bank transaction ID {}", batch.getBatchReference(), batch.getBankBatchId());
        return PayoutBatchDTO.fromEntity(batch);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PayoutBatchDTO> getAllPayoutBatches(Pageable pageable) {
        return batchRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(PayoutBatchDTO::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public PayoutBatchDTO getPayoutBatchById(UUID batchId) {
        PayoutBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Payout batch not found: " + batchId));
        return PayoutBatchDTO.fromEntity(batch);
    }
}
