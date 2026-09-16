package com.alight.marketplace.modules.inventory.dto;

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
public class WarehouseStockDto {
    private UUID id;
    private UUID warehouseId;
    private String warehouseName;
    private String warehouseCode;
    private UUID productId;
    private String productTitle;
    private String productSku;
    private UUID variantId;
    private String variantName;
    private String variantSku;
    private int quantityOnHand;
    private int quantityReserved;
    private int quantityAvailable;
    private int reorderThreshold;
    private int safetyStock;
    private boolean lowStock;
    private Instant createdAt;
    private Instant updatedAt;
}
