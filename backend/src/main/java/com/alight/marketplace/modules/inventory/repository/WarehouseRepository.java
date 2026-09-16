package com.alight.marketplace.modules.inventory.repository;

import com.alight.marketplace.modules.inventory.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, UUID> {

    Optional<Warehouse> findByCode(String code);

    List<Warehouse> findByVendorId(UUID vendorId);

    List<Warehouse> findByVendorIdAndActiveTrue(UUID vendorId);

    List<Warehouse> findByVendorIsNullAndActiveTrue();

    Optional<Warehouse> findByVendorIdAndPrimaryTrue(UUID vendorId);

    @Query("SELECT w FROM Warehouse w WHERE w.vendor.id = :vendorId OR w.vendor IS NULL AND w.active = true")
    List<Warehouse> findFulfillmentOptionsForVendor(@Param("vendorId") UUID vendorId);

    boolean existsByCode(String code);
}
