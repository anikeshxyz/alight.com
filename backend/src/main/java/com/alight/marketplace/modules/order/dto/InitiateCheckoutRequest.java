package com.alight.marketplace.modules.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InitiateCheckoutRequest {
    private String guestSessionId;

    @NotNull(message = "Shipping address is required")
    @Valid
    private CheckoutAddressDto shippingAddress;

    @Valid
    private CheckoutAddressDto billingAddress;

    private String paymentMethod; // e.g., "RAZORPAY", "COD", "BANK_TRANSFER", "MOCK"

    private String customerGstNumber;

    private String couponCode;

    private String notes;
}
