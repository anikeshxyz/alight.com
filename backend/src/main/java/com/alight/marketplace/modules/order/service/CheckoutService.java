package com.alight.marketplace.modules.order.service;

import com.alight.marketplace.modules.order.dto.CheckoutSummaryDto;
import com.alight.marketplace.modules.order.dto.InitiateCheckoutRequest;
import com.alight.marketplace.modules.order.dto.OrderDto;

import java.util.UUID;

public interface CheckoutService {
    CheckoutSummaryDto previewCheckout(UUID userId, InitiateCheckoutRequest request);
    OrderDto initiateCheckout(UUID userId, InitiateCheckoutRequest request);
}
