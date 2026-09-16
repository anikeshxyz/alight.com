package com.alight.marketplace.modules.bundle.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class CreateBundleRequest {

    @NotBlank(message = "Bundle title is required")
    @Size(max = 255)
    private String title;

    private String description;

    @NotNull(message = "Discount type is required")
    private String discountType; // PERCENT or FLAT

    @NotNull(message = "Discount value is required")
    private BigDecimal discountValue;

    @NotNull(message = "At least one item is required")
    @Size(min = 2, message = "A bundle must have at least 2 products")
    private List<BundleItemRequest> items;

    @Data
    public static class BundleItemRequest {
        @NotNull
        private UUID productId;
        private UUID variantId;
        private int quantity = 1;
    }
}
