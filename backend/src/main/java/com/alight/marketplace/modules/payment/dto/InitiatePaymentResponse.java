package com.alight.marketplace.modules.payment.dto;

import com.alight.marketplace.modules.payment.entity.PaymentGatewayType;
import lombok.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InitiatePaymentResponse {

    private UUID transactionId;
    private String transactionReference;
    private UUID orderId;
    private String orderNumber;
    private BigDecimal amount;
    private String currencyCode;
    private PaymentGatewayType gatewayType;
    
    // Gateway specific payloads
    private String gatewayOrderId; // Razorpay order_id or Stripe client_secret
    private String clientSecret; // Stripe client secret
    private String keyId; // Public API Key (Razorpay key_id or Stripe publishable_key)
    
    // Bank Transfer (B2B NEFT/RTGS) Details
    private String virtualAccountNumber;
    private String bankIfsc;
    private String beneficiaryName;
    private String bankName;
    private String bankBranch;
    
    private Map<String, Object> additionalData;
}
