package com.alight.marketplace.modules.settlement.repository;

import com.alight.marketplace.modules.settlement.entity.SettlementRateCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SettlementRateCardRepository extends JpaRepository<SettlementRateCard, UUID> {
    Optional<SettlementRateCard> findByRateCardCode(String rateCardCode);
    Optional<SettlementRateCard> findFirstByVendorIdAndIsActiveTrue(UUID vendorId);
    Optional<SettlementRateCard> findFirstByCategoryIdAndIsActiveTrue(UUID categoryId);
    Optional<SettlementRateCard> findFirstByRateCardCodeAndIsActiveTrue(String rateCardCode);
}
