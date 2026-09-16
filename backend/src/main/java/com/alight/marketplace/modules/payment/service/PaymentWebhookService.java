package com.alight.marketplace.modules.payment.service;

import com.alight.marketplace.modules.payment.dto.WebhookProcessResult;
import com.alight.marketplace.modules.payment.entity.PaymentGatewayType;

public interface PaymentWebhookService {

    WebhookProcessResult processRazorpayWebhook(String payload, String signature, String ipAddress);

    WebhookProcessResult processStripeWebhook(String payload, String signature, String ipAddress);

    WebhookProcessResult processGenericWebhook(PaymentGatewayType gatewayType, String eventId, String eventType, String payload, String signature, String ipAddress);
}
