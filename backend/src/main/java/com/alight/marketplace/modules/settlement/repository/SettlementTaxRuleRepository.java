package com.alight.marketplace.modules.settlement.repository;

import com.alight.marketplace.modules.settlement.entity.SettlementTaxRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SettlementTaxRuleRepository extends JpaRepository<SettlementTaxRule, UUID> {
    Optional<SettlementTaxRule> findByTaxRuleCode(String taxRuleCode);
    Optional<SettlementTaxRule> findFirstByTaxTypeAndJurisdictionAndIsActiveTrue(String taxType, String jurisdiction);
    Optional<SettlementTaxRule> findFirstByTaxTypeAndIsActiveTrue(String taxType);
}
