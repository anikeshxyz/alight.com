package com.alight.marketplace.modules.wishlist.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AddToWishlistRequest {
    @NotNull(message = "Product ID is required")
    private UUID productId;
    private UUID variantId;
}
