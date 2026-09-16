package com.alight.marketplace.modules.settlement.service;

import com.alight.marketplace.modules.settlement.dto.ReconciliationRecordDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReconciliationService {

    ReconciliationRecordDto runEscrowGatewayReconciliation();

    ReconciliationRecordDto runPayoutBankReconciliation();

    Page<ReconciliationRecordDto> getReconciliationAuditTrail(String status, Pageable pageable);
}
