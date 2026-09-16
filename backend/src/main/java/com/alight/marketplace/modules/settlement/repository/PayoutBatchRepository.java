package com.alight.marketplace.modules.settlement.repository;

import com.alight.marketplace.modules.settlement.entity.PayoutBatch;
import com.alight.marketplace.modules.settlement.entity.PayoutStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayoutBatchRepository extends JpaRepository<PayoutBatch, UUID> {

    Optional<PayoutBatch> findByBatchReference(String batchReference);

    Page<PayoutBatch> findByStatus(PayoutStatus status, Pageable pageable);

    Page<PayoutBatch> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
