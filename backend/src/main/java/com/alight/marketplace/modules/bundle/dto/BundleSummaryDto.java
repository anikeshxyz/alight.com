package com.alight.marketplace.modules.bundle.dto;

import com.alight.marketplace.modules.bundle.entity.BundleDiscountType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BundleSummaryDto {
    private UUID id;
    private String title;
    private String slug;
    private String description;
    private BundleDiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal totalOriginalPrice;
    private BigDecimal totalDiscountedPrice;
    private BigDecimal totalSavings;
    private int itemCount;
    private String primaryImageUrl; // from first bundle item product
    private Instant createdAt;
}
