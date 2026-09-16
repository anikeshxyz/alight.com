package com.alight.marketplace.modules.settlement.repository;

import com.alight.marketplace.modules.settlement.entity.SettlementPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SettlementPolicyRepository extends JpaRepository<SettlementPolicy, UUID> {
    Optional<SettlementPolicy> findByScopeAndScopeIdAndIsActiveTrue(String scope, UUID scopeId);
    Optional<SettlementPolicy> findFirstByScopeAndIsActiveTrue(String scope);
    List<SettlementPolicy> findByIsActiveTrue();
}
