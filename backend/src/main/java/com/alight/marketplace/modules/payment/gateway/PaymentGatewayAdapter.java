package com.alight.marketplace.modules.payment.gateway;

import com.alight.marketplace.modules.order.entity.Order;
import com.alight.marketplace.modules.payment.dto.InitiatePaymentResponse;
import com.alight.marketplace.modules.payment.dto.VerifyPaymentRequest;
import com.alight.marketplace.modules.payment.entity.PaymentGatewayType;
import com.alight.marketplace.modules.payment.entity.PaymentTransaction;

import java.math.BigDecimal;

public interface PaymentGatewayAdapter {
    PaymentGatewayType getGatewayType();
    
    InitiatePaymentResponse createOrder(PaymentTransaction transaction, Order order);
    
    boolean verifyPayment(PaymentTransaction transaction, VerifyPaymentRequest request);
    
    boolean processRefund(PaymentTransaction transaction, BigDecimal amount, String reason);
}
