package com.alight.marketplace.modules.inventory.repository;

import com.alight.marketplace.modules.inventory.entity.InventoryTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, UUID> {

    Page<InventoryTransaction> findByProductIdOrderByCreatedAtDesc(UUID productId, Pageable pageable);

    Page<InventoryTransaction> findByWarehouseIdOrderByCreatedAtDesc(UUID warehouseId, Pageable pageable);

    @Query("SELECT it FROM InventoryTransaction it JOIN it.warehouse w WHERE w.vendor.id = :vendorId ORDER BY it.createdAt DESC")
    Page<InventoryTransaction> findByVendorIdOrderByCreatedAtDesc(@Param("vendorId") UUID vendorId, Pageable pageable);

    List<InventoryTransaction> findByReferenceIdOrderByCreatedAtDesc(String referenceId);
}
