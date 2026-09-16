package com.alight.marketplace.modules.payment.dto;

import com.alight.marketplace.modules.payment.entity.PaymentGatewayType;
import com.alight.marketplace.modules.payment.entity.PaymentTransactionStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentTransactionDto {
    private UUID id;
    private String transactionReference;
    private UUID orderId;
    private String orderNumber;
    private UUID userId;
    private String customerEmail;
    private PaymentGatewayType gatewayType;
    private PaymentTransactionStatus transactionStatus;
    private BigDecimal amount;
    private String currencyCode;
    private String gatewayOrderId;
    private String gatewayPaymentId;
    private String paymentMethod;
    private String bankReferenceNumber;
    private String receiptUrl;
    private String errorCode;
    private String errorMessage;
    private Instant createdAt;
    private Instant updatedAt;
}
