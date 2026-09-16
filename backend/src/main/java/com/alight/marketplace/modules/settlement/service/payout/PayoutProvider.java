package com.alight.marketplace.modules.settlement.service.payout;

import com.alight.marketplace.modules.settlement.entity.VendorPayout;

public interface PayoutProvider {
    String getProviderType();
    PayoutResult disbursePayout(VendorPayout payout);
    PayoutResult checkStatus(String providerTransactionId);
}
