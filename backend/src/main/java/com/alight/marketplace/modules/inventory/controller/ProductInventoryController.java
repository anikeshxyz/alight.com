package com.alight.marketplace.modules.inventory.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.inventory.dto.ProductStockOverviewDto;
import com.alight.marketplace.modules.inventory.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Tag(name = "Product Inventory Availability", description = "Public real-time product stock and fulfillment breakdown")
public class ProductInventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/{id}/inventory")
    @Operation(summary = "Get product stock breakdown", description = "Returns real-time aggregate stock and warehouse dispatch availability for storefront PDP")
    public ResponseEntity<ApiResponse<ProductStockOverviewDto>> getProductStockOverview(@PathVariable UUID id) {
        ProductStockOverviewDto overview = inventoryService.getPublicProductStockOverview(id);
        return ResponseEntity.ok(ApiResponse.success(overview));
    }
}
