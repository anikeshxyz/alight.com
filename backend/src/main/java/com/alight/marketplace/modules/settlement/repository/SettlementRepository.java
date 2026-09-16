package com.alight.marketplace.modules.settlement.repository;

import com.alight.marketplace.modules.settlement.entity.Settlement;
import com.alight.marketplace.modules.settlement.entity.SettlementStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SettlementRepository extends JpaRepository<Settlement, UUID> {

    Optional<Settlement> findBySettlementNumber(String settlementNumber);

    Optional<Settlement> findByVendorOrderId(UUID vendorOrderId);

    boolean existsByVendorOrderId(UUID vendorOrderId);

    Page<Settlement> findByVendorIdOrderByCreatedAtDesc(UUID vendorId, Pageable pageable);

    Page<Settlement> findByStatusOrderByCreatedAtDesc(SettlementStatus status, Pageable pageable);

    Page<Settlement> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<Settlement> findByStatusAndEligibleAtBefore(SettlementStatus status, Instant cutoffTime);

    @Query("SELECT s FROM Settlement s WHERE s.status = :status AND (s.holdReason IS NULL OR s.holdReason = '')")
    List<Settlement> findReadyForAutoApproval(SettlementStatus status);
}
