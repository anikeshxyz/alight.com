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
public class InitiatePaymentRequest {

    @NotNull(message = "Order ID is required")
    private UUID orderId;

    @NotNull(message = "Gateway type is required")
    private PaymentGatewayType gatewayType;

    private String paymentMethod; // UPI, CARD, NETBANKING, WIRE
}
