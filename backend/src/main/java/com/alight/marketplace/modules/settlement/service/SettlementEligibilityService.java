package com.alight.marketplace.modules.settlement.service;

import com.alight.marketplace.modules.order.entity.VendorOrder;
import com.alight.marketplace.modules.settlement.entity.Settlement;
import com.alight.marketplace.modules.settlement.entity.SettlementPolicy;

import java.util.List;
import java.util.UUID;

public interface SettlementEligibilityService {

    SettlementPolicy resolvePolicy(VendorOrder vendorOrder);

    Settlement evaluateAndScheduleSettlement(VendorOrder vendorOrder);

    List<Settlement> processMaturedSettlements();

    Settlement holdSettlement(UUID settlementId, String reason, String actorEmail);

    Settlement releaseHold(UUID settlementId, String actorEmail);
}
