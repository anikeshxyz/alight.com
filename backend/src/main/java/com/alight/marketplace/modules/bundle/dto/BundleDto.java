package com.alight.marketplace.modules.bundle.dto;

import com.alight.marketplace.modules.bundle.entity.BundleDiscountType;
import com.alight.marketplace.modules.bundle.entity.BundleStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BundleDto {
    private UUID id;
    private String title;
    private String slug;
    private String description;
    private BundleDiscountType discountType;
    private BigDecimal discountValue;
    private BundleStatus status;
    private String vendorStoreName;
    private BigDecimal totalOriginalPrice;   // sum of all item base prices × qty
    private BigDecimal totalDiscountedPrice; // totalOriginalPrice - discount applied
    private BigDecimal totalSavings;         // totalOriginalPrice - totalDiscountedPrice
    private int itemCount;
    private List<BundleItemDto> items;
    private Instant createdAt;
}
