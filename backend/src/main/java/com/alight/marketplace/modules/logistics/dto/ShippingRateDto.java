package com.alight.marketplace.modules.logistics.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShippingRateDto {
    private String carrierCode;
    private String carrierName;
    private String shippingMode;
    private String zoneTier;
    private BigDecimal deadWeightKg;
    private BigDecimal volumetricWeightKg;
    private BigDecimal billedWeightKg;
    private BigDecimal baseFreightRate;
    private BigDecimal fuelSurchargeAmount;
    private BigDecimal remoteSurchargeAmount;
    private BigDecimal insuranceFee;
    private BigDecimal gstAmount;
    private BigDecimal totalShippingCost;
    private int estimatedTransitDays;
    private String estimatedDeliveryDate;
}
