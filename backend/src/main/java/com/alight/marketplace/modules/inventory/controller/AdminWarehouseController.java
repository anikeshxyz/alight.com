package com.alight.marketplace.modules.inventory.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.inventory.dto.*;
import com.alight.marketplace.modules.inventory.service.InventoryService;
import com.alight.marketplace.modules.inventory.service.WarehouseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin Warehouse & Global Inventory", description = "Platform administrator fulfillment network and cross-platform inventory governance")
public class AdminWarehouseController {

    private final WarehouseService warehouseService;
    private final InventoryService inventoryService;

    @GetMapping("/warehouses")
    @Operation(summary = "Get all network warehouses", description = "Lists all platform and vendor warehouses across the entire marketplace")
    public ResponseEntity<ApiResponse<List<WarehouseDto>>> getAllWarehouses() {
        List<WarehouseDto> warehouses = warehouseService.getAllWarehousesAdmin();
        return ResponseEntity.ok(ApiResponse.success(warehouses));
    }

    @PostMapping("/warehouses")
    @Operation(summary = "Create platform fulfillment center", description = "Creates a platform-owned central fulfillment warehouse")
    public ResponseEntity<ApiResponse<WarehouseDto>> createPlatformWarehouse(@Valid @RequestBody CreateWarehouseRequest request) {
        WarehouseDto created = warehouseService.createPlatformWarehouseAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created, "Platform warehouse created"));
    }

    @PutMapping("/warehouses/{id}")
    @Operation(summary = "Update warehouse details (Admin)", description = "Administratively updates any warehouse in the platform")
    public ResponseEntity<ApiResponse<WarehouseDto>> updateWarehouse(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateWarehouseRequest request
    ) {
        WarehouseDto updated = warehouseService.updateWarehouseAdmin(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Warehouse updated"));
    }

    @DeleteMapping("/warehouses/{id}")
    @Operation(summary = "Delete warehouse (Admin)", description = "Administratively deletes a warehouse")
    public ResponseEntity<ApiResponse<Void>> deleteWarehouse(@PathVariable UUID id) {
        warehouseService.deleteWarehouseAdmin(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Warehouse deleted"));
    }

    @GetMapping("/inventory")
    @Operation(summary = "Get global inventory telemetry", description = "Returns global stock distribution across all marketplace nodes")
    public ResponseEntity<ApiResponse<List<WarehouseStockDto>>> getGlobalInventory() {
        List<WarehouseStockDto> inventory = inventoryService.getAllInventoryAdmin();
        return ResponseEntity.ok(ApiResponse.success(inventory));
    }

    @GetMapping("/inventory/low-stock")
    @Operation(summary = "Get platform-wide low-stock alerts", description = "Returns all products and variants requiring restock")
    public ResponseEntity<ApiResponse<List<WarehouseStockDto>>> getGlobalLowStockAlerts() {
        List<WarehouseStockDto> alerts = inventoryService.getAllLowStockAlertsAdmin();
        return ResponseEntity.ok(ApiResponse.success(alerts));
    }

    @PostMapping("/inventory/adjust")
    @Operation(summary = "Administrative stock override", description = "Allows administrators to perform stock adjustments on any warehouse")
    public ResponseEntity<ApiResponse<WarehouseStockDto>> adjustStockAdmin(
            @Valid @RequestBody StockAdjustmentRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        WarehouseStockDto adjusted = inventoryService.adjustStockAdmin(request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(adjusted, "Administrative stock adjustment applied"));
    }

    @GetMapping("/inventory/transactions")
    @Operation(summary = "Get platform inventory transactions", description = "Global immutable audit ledger of all stock adjustments and transfers")
    public ResponseEntity<ApiResponse<Page<InventoryTransactionDto>>> getGlobalTransactions(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<InventoryTransactionDto> transactions = inventoryService.getAllTransactionsAdmin(pageable);
        return ResponseEntity.ok(ApiResponse.success(transactions));
    }
}
