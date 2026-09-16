package com.alight.marketplace.modules.settlement.service;

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
import com.alight.marketplace.modules.settlement.service.impl.EscrowAutomationServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EscrowAutomationServiceTest {

    @Mock
    private VendorOrderRepository vendorOrderRepository;

    @Mock
    private SettlementService settlementService;

    @Mock
    private PayoutBatchRepository batchRepository;

    @Mock
    private VendorPayoutRepository payoutRepository;

    @Mock
    private SettlementEligibilityService eligibilityService;

    @InjectMocks
    private EscrowAutomationServiceImpl escrowAutomationService;

    @Test
    @DisplayName("Should run automated settlement for delivered sub-orders")
    void shouldRunAutoSettlement() {
        UUID orderId = UUID.randomUUID();
        VendorOrder deliveredOrder = VendorOrder.builder()
                .id(orderId)
                .subOrderNumber("ORD-2026-001-V1")
                .fulfillmentStatus(FulfillmentStatus.DELIVERED)
                .subtotal(new BigDecimal("15000.00"))
                .build();

        when(vendorOrderRepository.findByFulfillmentStatus(FulfillmentStatus.DELIVERED))
                .thenReturn(List.of(deliveredOrder));
        when(eligibilityService.processMaturedSettlements()).thenReturn(List.of());
        com.alight.marketplace.modules.settlement.entity.Settlement mockSettlement = com.alight.marketplace.modules.settlement.entity.Settlement.builder()
                .settlementNumber("ORD-2026-001-V1")
                .status(com.alight.marketplace.modules.settlement.entity.SettlementStatus.SETTLED)
                .netPayableAmount(new BigDecimal("15000.00"))
                .platformCommission(BigDecimal.ZERO)
                .taxWithholdingAmount(BigDecimal.ZERO)
                .build();
        when(eligibilityService.evaluateAndScheduleSettlement(deliveredOrder)).thenReturn(mockSettlement);

        AutoSettlementResultDTO result = escrowAutomationService.runAutoSettlementForDeliveredOrders();

        assertThat(result).isNotNull();
        assertThat(result.getOrdersProcessed()).isEqualTo(1);
        assertThat(result.getOrdersSettled()).isEqualTo(1);
        assertThat(result.getTotalAmountReleased()).isEqualByComparingTo("15000.00");
        verify(eligibilityService).evaluateAndScheduleSettlement(deliveredOrder);
    }

    @Test
    @DisplayName("Should create payout batch for selected vendor payouts")
    void shouldCreatePayoutBatch() {
        UUID payoutId = UUID.randomUUID();
        VendorPayout payout = VendorPayout.builder()
                .id(payoutId)
                .payoutReference("PO-101")
                .amount(new BigDecimal("25000.00"))
                .currencyCode("INR")
                .status(PayoutStatus.APPROVED)
                .build();

        when(payoutRepository.findAllById(List.of(payoutId))).thenReturn(List.of(payout));
        when(batchRepository.save(any(PayoutBatch.class))).thenAnswer(inv -> {
            PayoutBatch b = inv.getArgument(0);
            b.setId(UUID.randomUUID());
            return b;
        });

        CreatePayoutBatchRequest req = CreatePayoutBatchRequest.builder()
                .payoutIds(List.of(payoutId))
                .notes("Bulk run")
                .build();

        PayoutBatchDTO batch = escrowAutomationService.createPayoutBatch(req);

        assertThat(batch).isNotNull();
        assertThat(batch.getPayoutCount()).isEqualTo(1);
        assertThat(batch.getTotalAmount()).isEqualByComparingTo("25000.00");
        assertThat(batch.getStatus()).isEqualTo(PayoutStatus.PROCESSING);
        verify(batchRepository).save(any(PayoutBatch.class));
    }
}
