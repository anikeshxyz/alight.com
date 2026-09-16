package com.alight.marketplace.modules.product.dto;

import com.alight.marketplace.modules.product.entity.ProductStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProductStatusRequest {

    @NotNull(message = "Product status is required")
    private ProductStatus status;

    private String rejectionReason;
}
