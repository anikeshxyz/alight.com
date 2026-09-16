package com.alight.marketplace.modules.payment.gateway;

import com.alight.marketplace.modules.order.entity.Order;
import com.alight.marketplace.modules.payment.dto.InitiatePaymentResponse;
import com.alight.marketplace.modules.payment.dto.VerifyPaymentRequest;
import com.alight.marketplace.modules.payment.entity.PaymentGatewayType;
import com.alight.marketplace.modules.payment.entity.PaymentTransaction;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Component
public class StripeGatewayAdapter implements PaymentGatewayAdapter {

    @Value("${app.payment.stripe.publishable-key:pk_test_alightstripe123}")
    private String publishableKey;

    @Override
    public PaymentGatewayType getGatewayType() {
        return PaymentGatewayType.STRIPE;
    }

    @Override
    public InitiatePaymentResponse createOrder(PaymentTransaction transaction, Order order) {
        String paymentIntentId = "pi_" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);
        String clientSecret = paymentIntentId + "_secret_" + UUID.randomUUID().toString().substring(0, 8);
        
        transaction.setGatewayOrderId(paymentIntentId);

        return InitiatePaymentResponse.builder()
                .transactionId(transaction.getId())
                .transactionReference(transaction.getTransactionReference())
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .amount(transaction.getAmount())
                .currencyCode(transaction.getCurrencyCode())
                .gatewayType(PaymentGatewayType.STRIPE)
                .gatewayOrderId(paymentIntentId)
                .clientSecret(clientSecret)
                .keyId(publishableKey)
                .additionalData(Map.of(
                        "paymentIntentId", paymentIntentId,
                        "publishableKey", publishableKey
                ))
                .build();
    }

    @Override
    public boolean verifyPayment(PaymentTransaction transaction, VerifyPaymentRequest request) {
        if (request.getStripePaymentIntentId() == null && request.getTransactionId() == null) {
            return false;
        }

        String piId = request.getStripePaymentIntentId() != null 
                ? request.getStripePaymentIntentId() 
                : transaction.getGatewayOrderId();
                
        transaction.setGatewayPaymentId("ch_" + UUID.randomUUID().toString().substring(0, 16));
        transaction.setGatewayOrderId(piId);
        transaction.setPaymentMethod("STRIPE_CARD");
        return true;
    }

    @Override
    public boolean processRefund(PaymentTransaction transaction, BigDecimal amount, String reason) {
        return true;
    }
}
