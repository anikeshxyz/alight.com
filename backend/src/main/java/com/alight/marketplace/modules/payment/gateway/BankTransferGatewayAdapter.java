package com.alight.marketplace.modules.payment.gateway;

import com.alight.marketplace.modules.order.entity.Order;
import com.alight.marketplace.modules.payment.dto.InitiatePaymentResponse;
import com.alight.marketplace.modules.payment.dto.VerifyPaymentRequest;
import com.alight.marketplace.modules.payment.entity.PaymentGatewayType;
import com.alight.marketplace.modules.payment.entity.PaymentTransaction;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;

@Component
public class BankTransferGatewayAdapter implements PaymentGatewayAdapter {

    @Override
    public PaymentGatewayType getGatewayType() {
        return PaymentGatewayType.BANK_TRANSFER;
    }

    @Override
    public InitiatePaymentResponse createOrder(PaymentTransaction transaction, Order order) {
        // Generate Unique Virtual Escrow Account per Master Order
        String virtualAccount = "ALIGHT" + order.getOrderNumber().replace("ORD-", "").replace("-", "");

        return InitiatePaymentResponse.builder()
                .transactionId(transaction.getId())
                .transactionReference(transaction.getTransactionReference())
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .amount(transaction.getAmount())
                .currencyCode(transaction.getCurrencyCode())
                .gatewayType(PaymentGatewayType.BANK_TRANSFER)
                .virtualAccountNumber(virtualAccount)
                .bankIfsc("HDFC0000001")
                .beneficiaryName("Alight International Marketplace Escrow Account")
                .bankName("HDFC Bank Limited")
                .bankBranch("Corporate Banking Branch, Nariman Point, Mumbai")
                .additionalData(Map.of(
                        "paymentMode", "NEFT/RTGS/IMPS",
                        "instructions", "Transfer exact total amount quoting Reference " + order.getOrderNumber()
                ))
                .build();
    }

    @Override
    public boolean verifyPayment(PaymentTransaction transaction, VerifyPaymentRequest request) {
        if (request.getBankReferenceNumber() != null && !request.getBankReferenceNumber().isBlank()) {
            transaction.setBankReferenceNumber(request.getBankReferenceNumber());
        }
        if (request.getReceiptUrl() != null && !request.getReceiptUrl().isBlank()) {
            transaction.setReceiptUrl(request.getReceiptUrl());
        }
        transaction.setPaymentMethod("DIRECT_BANK_TRANSFER");
        // For Bank Transfer, submission of UTR marks it as submitted pending manual admin clearance
        return true;
    }

    @Override
    public boolean processRefund(PaymentTransaction transaction, BigDecimal amount, String reason) {
        return true;
    }
}
