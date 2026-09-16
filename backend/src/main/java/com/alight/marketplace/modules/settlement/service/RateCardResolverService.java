package com.alight.marketplace.modules.settlement.service;

import com.alight.marketplace.modules.order.entity.VendorOrder;
import com.alight.marketplace.modules.settlement.entity.SettlementRateCard;
import com.alight.marketplace.modules.settlement.entity.SettlementTaxRule;

public interface RateCardResolverService {
    SettlementRateCard resolveRateCard(VendorOrder vendorOrder);
    SettlementTaxRule resolveTaxRule(VendorOrder vendorOrder);
}
