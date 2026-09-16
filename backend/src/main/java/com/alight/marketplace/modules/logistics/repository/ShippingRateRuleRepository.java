package com.alight.marketplace.modules.logistics.repository;

import com.alight.marketplace.modules.logistics.entity.ShippingRateRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShippingRateRuleRepository extends JpaRepository<ShippingRateRule, UUID> {
    Optional<ShippingRateRule> findByZoneTierAndShippingMode(String zoneTier, String shippingMode);
}
