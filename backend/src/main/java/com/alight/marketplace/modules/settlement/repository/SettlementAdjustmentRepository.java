package com.alight.marketplace.modules.settlement.repository;

import com.alight.marketplace.modules.settlement.entity.SettlementAdjustment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SettlementAdjustmentRepository extends JpaRepository<SettlementAdjustment, UUID> {
    List<SettlementAdjustment> findBySettlementId(UUID settlementId);
    Page<SettlementAdjustment> findByVendorIdOrderByCreatedAtDesc(UUID vendorId, Pageable pageable);
}
