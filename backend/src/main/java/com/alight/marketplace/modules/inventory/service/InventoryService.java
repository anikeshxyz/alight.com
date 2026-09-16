package com.alight.marketplace.modules.inventory.service;

import com.alight.marketplace.modules.inventory.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface InventoryService {

    List<WarehouseStockDto> getVendorInventory(String userEmail);

    List<WarehouseStockDto> getInventoryByWarehouse(UUID warehouseId, String userEmail);

    List<WarehouseStockDto> getInventoryByProduct(UUID productId, String userEmail);

    WarehouseStockDto adjustStock(StockAdjustmentRequest request, String userEmail);

    void transferStock(StockTransferRequest request, String userEmail);

    List<WarehouseStockDto> getVendorLowStockAlerts(String userEmail);

    Page<InventoryTransactionDto> getVendorTransactions(String userEmail, Pageable pageable);

    // Public Storefront Stock Check
    ProductStockOverviewDto getPublicProductStockOverview(UUID productId);

    // Admin Operations
    List<WarehouseStockDto> getAllInventoryAdmin();

    List<WarehouseStockDto> getAllLowStockAlertsAdmin();

    Page<InventoryTransactionDto> getAllTransactionsAdmin(Pageable pageable);

    WarehouseStockDto adjustStockAdmin(StockAdjustmentRequest request, String adminEmail);
}
