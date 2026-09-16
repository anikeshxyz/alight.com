package com.alight.marketplace.modules.inventory.dto;

import com.alight.marketplace.modules.inventory.entity.TransactionType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockAdjustmentRequest {

    @NotNull(message = "Warehouse ID is required")
    private UUID warehouseId;

    @NotNull(message = "Product ID is required")
    private UUID productId;

    private UUID variantId;

    @NotNull(message = "Transaction type is required")
    private TransactionType transactionType;

    /**
     * Positive integer for how many units to add or subtract.
     */
    @NotNull(message = "Quantity is required")
    private Integer quantity;

    private String referenceType;
    private String referenceId;
    private String notes;
}
