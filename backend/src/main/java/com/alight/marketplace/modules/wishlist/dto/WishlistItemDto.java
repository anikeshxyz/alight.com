package com.alight.marketplace.modules.wishlist.dto;

import com.alight.marketplace.modules.product.dto.ProductSummaryDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistItemDto {
    private UUID id;
    private UUID productId;
    private String variantId;
    private ProductSummaryDto product;
    private Instant addedAt;
}
