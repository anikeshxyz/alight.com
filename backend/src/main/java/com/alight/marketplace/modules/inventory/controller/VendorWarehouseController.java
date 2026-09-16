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
@RequestMapping("/api/v1/vendor")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VENDOR') or hasRole('ADMIN')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Vendor Inventory & Warehouses", description = "Vendor fulfillment hub management and multi-location inventory adjustments")
public class VendorWarehouseController {

    private final WarehouseService warehouseService;
    private final InventoryService inventoryService;

    // --- Warehouses ---

    @GetMapping("/warehouses")
    @Operation(summary = "Get vendor warehouses", description = "Lists all fulfillment centers and dispatch nodes registered by the current vendor")
    public ResponseEntity<ApiResponse<List<WarehouseDto>>> getVendorWarehouses(@AuthenticationPrincipal UserDetails userDetails) {
        List<WarehouseDto> warehouses = warehouseService.getVendorWarehouses(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(warehouses));
    }

    @GetMapping("/warehouses/{id}")
    @Operation(summary = "Get vendor warehouse by ID", description = "Retrieves details of a specific vendor warehouse")
    public ResponseEntity<ApiResponse<WarehouseDto>> getVendorWarehouseById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        WarehouseDto warehouse = warehouseService.getVendorWarehouseById(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(warehouse));
    }

    @PostMapping("/warehouses")
    @Operation(summary = "Create vendor warehouse", description = "Registers a new dispatch center or warehouse location for the vendor")
    public ResponseEntity<ApiResponse<WarehouseDto>> createVendorWarehouse(
            @Valid @RequestBody CreateWarehouseRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        WarehouseDto created = warehouseService.createVendorWarehouse(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created, "Warehouse created successfully"));
    }

    @PutMapping("/warehouses/{id}")
    @Operation(summary = "Update vendor warehouse", description = "Updates details and address of an existing vendor warehouse")
    public ResponseEntity<ApiResponse<WarehouseDto>> updateVendorWarehouse(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateWarehouseRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        WarehouseDto updated = warehouseService.updateVendorWarehouse(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(updated, "Warehouse updated successfully"));
    }

    @DeleteMapping("/warehouses/{id}")
    @Operation(summary = "Delete vendor warehouse", description = "Removes a vendor warehouse location")
    public ResponseEntity<ApiResponse<Void>> deleteVendorWarehouse(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        warehouseService.deleteVendorWarehouse(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(null, "Warehouse deleted successfully"));
    }

    // --- Inventory & Stock ---

    @GetMapping("/inventory")
    @Operation(summary = "Get vendor multi-warehouse inventory", description = "Returns full inventory matrix across all vendor warehouses")
    public ResponseEntity<ApiResponse<List<WarehouseStockDto>>> getVendorInventory(@AuthenticationPrincipal UserDetails userDetails) {
        List<WarehouseStockDto> inventory = inventoryService.getVendorInventory(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(inventory));
    }

    @GetMapping("/inventory/low-stock")
    @Operation(summary = "Get vendor low-stock alerts", description = "Returns items where available stock is below the reorder threshold")
    public ResponseEntity<ApiResponse<List<WarehouseStockDto>>> getVendorLowStockAlerts(@AuthenticationPrincipal UserDetails userDetails) {
        List<WarehouseStockDto> alerts = inventoryService.getVendorLowStockAlerts(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(alerts));
    }

    @PostMapping("/inventory/adjust")
    @Operation(summary = "Adjust inventory stock", description = "Performs an audited stock intake, write-off, or manual count adjustment")
    public ResponseEntity<ApiResponse<WarehouseStockDto>> adjustStock(
            @Valid @RequestBody StockAdjustmentRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        WarehouseStockDto adjusted = inventoryService.adjustStock(request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(adjusted, "Stock adjustment recorded successfully"));
    }

    @PostMapping("/inventory/transfer")
    @Operation(summary = "Transfer stock between warehouses", description = "Moves inventory quantity from one vendor warehouse to another")
    public ResponseEntity<ApiResponse<Void>> transferStock(
            @Valid @RequestBody StockTransferRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        inventoryService.transferStock(request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(null, "Stock transfer completed successfully"));
    }

    @GetMapping("/inventory/transactions")
    @Operation(summary = "Get vendor inventory audit ledger", description = "Returns paginated immutable transaction history logs")
    public ResponseEntity<ApiResponse<Page<InventoryTransactionDto>>> getVendorTransactions(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<InventoryTransactionDto> transactions = inventoryService.getVendorTransactions(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(ApiResponse.success(transactions));
    }
}
