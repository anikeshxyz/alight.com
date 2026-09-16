package com.alight.marketplace.modules.settlement.repository;

import com.alight.marketplace.modules.settlement.entity.PayoutStatus;
import com.alight.marketplace.modules.settlement.entity.VendorPayout;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VendorPayoutRepository extends JpaRepository<VendorPayout, UUID> {
    Optional<VendorPayout> findByPayoutReference(String payoutReference);
    List<VendorPayout> findByVendorIdOrderByRequestedAtDesc(UUID vendorId);
    Page<VendorPayout> findByVendorIdOrderByRequestedAtDesc(UUID vendorId, Pageable pageable);
    Page<VendorPayout> findByStatusOrderByRequestedAtDesc(PayoutStatus status, Pageable pageable);
    Page<VendorPayout> findAllByOrderByRequestedAtDesc(Pageable pageable);
    boolean existsByIdempotencyKey(String idempotencyKey);
    Optional<VendorPayout> findByIdempotencyKey(String idempotencyKey);
}
