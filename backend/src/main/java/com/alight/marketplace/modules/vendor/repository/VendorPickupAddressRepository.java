package com.alight.marketplace.modules.vendor.repository;

import com.alight.marketplace.modules.vendor.entity.VendorPickupAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VendorPickupAddressRepository extends JpaRepository<VendorPickupAddress, UUID> {

    List<VendorPickupAddress> findByVendorId(UUID vendorId);

    Optional<VendorPickupAddress> findByIdAndVendorId(UUID id, UUID vendorId);

    Optional<VendorPickupAddress> findByVendorIdAndPrimaryTrue(UUID vendorId);
}
