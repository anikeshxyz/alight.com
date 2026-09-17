package com.alight.marketplace.modules.analytics.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorOperationalBadgesDTO {

    private long orders;
    private long fulfillment;
    private long lowStock;
    private long outOfStock;
    private long returns;
    private long quotes;
}
