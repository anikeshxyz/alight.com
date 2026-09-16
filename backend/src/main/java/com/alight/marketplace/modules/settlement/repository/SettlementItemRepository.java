package com.alight.marketplace.modules.settlement.repository;

import com.alight.marketplace.modules.settlement.entity.SettlementItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SettlementItemRepository extends JpaRepository<SettlementItem, UUID> {
    List<SettlementItem> findBySettlementId(UUID settlementId);
    List<SettlementItem> findByOrderItemId(UUID orderItemId);
}
