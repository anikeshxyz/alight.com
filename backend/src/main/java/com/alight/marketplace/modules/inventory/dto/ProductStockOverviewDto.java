package com.alight.marketplace.modules.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductStockOverviewDto {
    private UUID productId;
    private String productTitle;
    private String productSku;
    private int totalAvailableQuantity;
    private boolean inStock;
    private boolean lowStock;
    private List<WarehouseStockDto> warehouseBreakdown;
}
