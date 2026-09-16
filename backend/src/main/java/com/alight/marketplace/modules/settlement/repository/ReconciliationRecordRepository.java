package com.alight.marketplace.modules.settlement.repository;

import com.alight.marketplace.modules.settlement.entity.ReconciliationRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReconciliationRecordRepository extends JpaRepository<ReconciliationRecord, UUID> {
    Optional<ReconciliationRecord> findByRecordReference(String recordReference);
    Page<ReconciliationRecord> findByStatusOrderByReconciledAtDesc(String status, Pageable pageable);
    Page<ReconciliationRecord> findAllByOrderByReconciledAtDesc(Pageable pageable);
}
