package com.alight.marketplace.modules.settlement.service;

import com.alight.marketplace.modules.returns.entity.RmaRequest;
import com.alight.marketplace.modules.settlement.dto.VendorDebtRecoveryDto;
import com.alight.marketplace.modules.settlement.entity.SettlementAdjustment;
import com.alight.marketplace.modules.settlement.entity.VendorDebtRecovery;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.UUID;

public interface VendorRecoveryService {

    SettlementAdjustment applyPostSettlementReturnDebit(RmaRequest rma, BigDecimal netRefundAmount, String actorEmail);

    SettlementAdjustment applyManualAdjustment(UUID vendorId, UUID settlementId, String adjustmentType, BigDecimal amount, String reason, String actorEmail);

    BigDecimal clawbackFromSettlement(Vendor vendor, BigDecimal netSettlementCredit);

    Page<VendorDebtRecoveryDto> getVendorRecoveries(UUID vendorId, Pageable pageable);

    Page<VendorDebtRecoveryDto> getAllRecoveriesAdmin(Pageable pageable);
}
