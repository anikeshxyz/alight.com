package com.alight.marketplace.modules.payment.gateway;

import com.alight.marketplace.modules.order.entity.Order;
import com.alight.marketplace.modules.payment.dto.InitiatePaymentResponse;
import com.alight.marketplace.modules.payment.dto.VerifyPaymentRequest;
import com.alight.marketplace.modules.payment.entity.PaymentGatewayType;
import com.alight.marketplace.modules.payment.entity.PaymentTransaction;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Component
public class MockGatewayAdapter implements PaymentGatewayAdapter {

    @Override
    public PaymentGatewayType getGatewayType() {
        return PaymentGatewayType.MOCK;
    }

    @Override
    public InitiatePaymentResponse createOrder(PaymentTransaction transaction, Order order) {
        String mockOrderId = "mock_ord_" + UUID.randomUUID().toString().substring(0, 12);
        transaction.setGatewayOrderId(mockOrderId);
        
        return InitiatePaymentResponse.builder()
                .transactionId(transaction.getId())
                .transactionReference(transaction.getTransactionReference())
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .amount(transaction.getAmount())
                .currencyCode(transaction.getCurrencyCode())
                .gatewayType(PaymentGatewayType.MOCK)
                .gatewayOrderId(mockOrderId)
                .additionalData(Map.of("simulatorMode", "instant_sandbox_success"))
                .build();
    }

    @Override
    public boolean verifyPayment(PaymentTransaction transaction, VerifyPaymentRequest request) {
        // Mock gateway automatically validates
        transaction.setGatewayPaymentId("mock_pay_" + UUID.randomUUID().toString().substring(0, 12));
        transaction.setGatewaySignature("mock_sig_valid");
        transaction.setPaymentMethod("MOCK_SIMULATOR");
        return true;
    }

    @Override
    public boolean processRefund(PaymentTransaction transaction, BigDecimal amount, String reason) {
        return true;
    }
}
