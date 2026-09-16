package com.alight.marketplace.modules.logistics.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceabilityResponseDto {
    private String pincode;
    private String city;
    private String state;
    private String zoneTier;
    private boolean isServiceable;
    private boolean isPrepaidServiceable;
    private boolean isCodServiceable;
    private boolean isExpressServiceable;
    private int estimatedTransitDays;
    private String estimatedDeliveryDate;
    private BigDecimal remoteSurcharge;
    private String primaryCourierPartner;
}
