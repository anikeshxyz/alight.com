package com.alight.marketplace.modules.inventory.repository;

import com.alight.marketplace.modules.inventory.entity.WarehouseStock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WarehouseStockRepository extends JpaRepository<WarehouseStock, UUID> {

    Optional<WarehouseStock> findByWarehouseIdAndProductIdAndVariantId(UUID warehouseId, UUID productId, UUID variantId);

    Optional<WarehouseStock> findFirstByWarehouseIdAndProductIdAndVariantIsNull(UUID warehouseId, UUID productId);
    Optional<WarehouseStock> findByWarehouseIdAndProductIdAndVariantIsNull(UUID warehouseId, UUID productId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ws FROM WarehouseStock ws WHERE ws.warehouse.id = :warehouseId AND ws.product.id = :productId AND ws.variant.id = :variantId")
    Optional<WarehouseStock> findByWarehouseAndProductAndVariantForUpdate(
            @Param("warehouseId") UUID warehouseId,
            @Param("productId") UUID productId,
            @Param("variantId") UUID variantId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ws FROM WarehouseStock ws WHERE ws.warehouse.id = :warehouseId AND ws.product.id = :productId AND ws.variant IS NULL")
    Optional<WarehouseStock> findByWarehouseAndProductForUpdate(
            @Param("warehouseId") UUID warehouseId,
            @Param("productId") UUID productId
    );

    List<WarehouseStock> findByProductId(UUID productId);

    List<WarehouseStock> findByWarehouseId(UUID warehouseId);

    @Query("SELECT ws FROM WarehouseStock ws JOIN ws.warehouse w WHERE w.vendor.id = :vendorId")
    List<WarehouseStock> findByVendorId(@Param("vendorId") UUID vendorId);

    long countByProductIdAndVariantId(UUID productId, UUID variantId);

    @Query("SELECT COALESCE(SUM(ws.quantityOnHand - ws.quantityReserved), 0) FROM WarehouseStock ws WHERE ws.product.id = :productId AND ws.warehouse.active = true")
    int sumAvailableStockByProduct(@Param("productId") UUID productId);

    @Query("SELECT COALESCE(SUM(ws.quantityOnHand - ws.quantityReserved), 0) FROM WarehouseStock ws WHERE ws.product.id = :productId AND ws.variant.id = :variantId AND ws.warehouse.active = true")
    int sumAvailableStockByVariant(@Param("productId") UUID productId, @Param("variantId") UUID variantId);

    @Query("SELECT COALESCE(SUM(ws.quantityOnHand - ws.quantityReserved), 0) FROM WarehouseStock ws WHERE ws.product.id = :productId AND (ws.variant.id = :variantId OR ws.variant IS NULL) AND ws.warehouse.active = true")
    int sumAvailableStockByProductAndVariant(@Param("productId") UUID productId, @Param("variantId") UUID variantId);

    @Query("SELECT ws FROM WarehouseStock ws WHERE ws.warehouse.vendor.id = :vendorId AND (ws.quantityOnHand - ws.quantityReserved) <= ws.reorderThreshold")
    List<WarehouseStock> findLowStockAlertsByVendorId(@Param("vendorId") UUID vendorId);

    @Query("SELECT ws FROM WarehouseStock ws WHERE (ws.quantityOnHand - ws.quantityReserved) <= ws.reorderThreshold")
    List<WarehouseStock> findAllLowStockAlerts();
}
