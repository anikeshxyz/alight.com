package com.alight.marketplace.modules.analytics.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorTopProductDTO {

    private UUID productId;
    private String title;
    private String sku;
    private String categoryName;
    private String imageUrl;
    private int unitsSold;
    private BigDecimal revenue;
    private int stockQuantity;
    private String status; // "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"
}
