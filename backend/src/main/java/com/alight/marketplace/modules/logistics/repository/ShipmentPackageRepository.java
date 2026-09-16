package com.alight.marketplace.modules.logistics.repository;

import com.alight.marketplace.modules.logistics.entity.ShipmentPackage;
import com.alight.marketplace.modules.logistics.entity.ShipmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShipmentPackageRepository extends JpaRepository<ShipmentPackage, UUID> {
    Optional<ShipmentPackage> findByAwbNumber(String awbNumber);
    Optional<ShipmentPackage> findByVendorOrderId(UUID vendorOrderId);
    List<ShipmentPackage> findByMasterOrderId(UUID masterOrderId);
    Page<ShipmentPackage> findByVendorId(UUID vendorId, Pageable pageable);
    Page<ShipmentPackage> findByStatus(ShipmentStatus status, Pageable pageable);
    long countByStatus(ShipmentStatus status);
}
