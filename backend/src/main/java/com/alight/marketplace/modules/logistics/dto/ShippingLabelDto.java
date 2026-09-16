package com.alight.marketplace.modules.logistics.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShippingLabelDto {
    private String awbNumber;
    private String barcodeBase64;
    private String qrCodePayload;
    private String carrierName;
    private String shippingMode;
    private String subOrderNumber;
    private String masterOrderNumber;
    private Instant orderDate;
    
    // Vendor / Origin
    private String senderName;
    private String senderAddressLine;
    private String senderCity;
    private String senderState;
    private String senderPincode;
    private String senderPhone;
    private String senderGstNumber;
    
    // Customer / Destination
    private String recipientName;
    private String recipientAddressLine;
    private String recipientCity;
    private String recipientState;
    private String recipientPincode;
    private String recipientPhone;
    
    // Package & Commercials
    private BigDecimal billedWeightKg;
    private BigDecimal declaredValue;
    private String paymentMethod;
    private boolean isCod;
    private BigDecimal codAmountToCollect;
    private String routingCode;
    
    // Items manifest
    private List<LabelItemDto> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LabelItemDto {
        private String productTitle;
        private String variantSku;
        private int quantity;
    }
}
