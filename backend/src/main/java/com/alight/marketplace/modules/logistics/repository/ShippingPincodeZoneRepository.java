package com.alight.marketplace.modules.logistics.repository;

import com.alight.marketplace.modules.logistics.entity.ShippingPincodeZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShippingPincodeZoneRepository extends JpaRepository<ShippingPincodeZone, UUID> {
    Optional<ShippingPincodeZone> findByPincode(String pincode);
}
