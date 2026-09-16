package com.alight.marketplace.modules.settlement.service;

import com.alight.marketplace.modules.settlement.dto.AutoSettlementResultDTO;
import com.alight.marketplace.modules.settlement.dto.CreatePayoutBatchRequest;
import com.alight.marketplace.modules.settlement.dto.PayoutBatchDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface EscrowAutomationService {

    AutoSettlementResultDTO runAutoSettlementForDeliveredOrders();

    PayoutBatchDTO createPayoutBatch(CreatePayoutBatchRequest request);

    PayoutBatchDTO processPayoutBatch(UUID batchId, String bankBatchId);

    Page<PayoutBatchDTO> getAllPayoutBatches(Pageable pageable);

    PayoutBatchDTO getPayoutBatchById(UUID batchId);
}
