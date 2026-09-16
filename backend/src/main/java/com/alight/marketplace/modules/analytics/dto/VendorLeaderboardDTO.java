package com.alight.marketplace.modules.analytics.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorLeaderboardDTO {

    private UUID vendorId;
    private String storeName;
    private BigDecimal grossSales;
    private long ordersFulfilled;
    private double fulfillmentRate;
    private double customerRating;
}
