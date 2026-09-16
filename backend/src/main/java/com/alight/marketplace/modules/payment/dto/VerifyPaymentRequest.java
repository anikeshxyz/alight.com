package com.alight.marketplace.modules.payment.dto;

import com.alight.marketplace.modules.payment.entity.PaymentGatewayType;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyPaymentRequest {

    @NotNull(message = "Transaction ID is required")
    private UUID transactionId;

    @NotNull(message = "Gateway type is required")
    private PaymentGatewayType gatewayType;

    // Razorpay verification fields
    private String razorpayPaymentId;
    private String razorpayOrderId;
    private String razorpaySignature;

    // Stripe verification fields
    private String stripePaymentIntentId;

    // Bank Transfer proof submission
    private String bankReferenceNumber;
    private String receiptUrl;
    private String notes;
}
