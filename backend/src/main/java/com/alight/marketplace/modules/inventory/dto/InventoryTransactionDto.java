package com.alight.marketplace.modules.inventory.dto;

import com.alight.marketplace.modules.inventory.entity.TransactionType;
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
public class InventoryTransactionDto {
    private UUID id;
    private UUID warehouseId;
    private String warehouseName;
    private String warehouseCode;
    private UUID productId;
    private String productTitle;
    private String productSku;
    private UUID variantId;
    private String variantName;
    private TransactionType transactionType;
    private int quantityChange;
    private int quantityBefore;
    private int quantityAfter;
    private String referenceType;
    private String referenceId;
    private String notes;
    private String performedByName;
    private Instant createdAt;
}
