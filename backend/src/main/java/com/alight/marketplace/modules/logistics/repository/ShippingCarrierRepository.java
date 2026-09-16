package com.alight.marketplace.modules.logistics.repository;

import com.alight.marketplace.modules.logistics.entity.ShippingCarrier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShippingCarrierRepository extends JpaRepository<ShippingCarrier, UUID> {
    Optional<ShippingCarrier> findByCarrierCode(String carrierCode);
    List<ShippingCarrier> findByActiveTrueOrderByPriorityAsc();
}
