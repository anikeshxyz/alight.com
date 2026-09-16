package com.alight.marketplace.modules.settlement.repository;

import com.alight.marketplace.modules.settlement.entity.WalletTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, UUID> {
    List<WalletTransaction> findByVendorIdOrderByCreatedAtDesc(UUID vendorId);
    Page<WalletTransaction> findByVendorIdOrderByCreatedAtDesc(UUID vendorId, Pageable pageable);
    Page<WalletTransaction> findAllByOrderByCreatedAtDesc(Pageable pageable);
    boolean existsByVendorOrderIdAndTransactionType(UUID vendorOrderId, com.alight.marketplace.modules.settlement.entity.WalletTransactionType transactionType);
    boolean existsByIdempotencyKey(String idempotencyKey);
    List<WalletTransaction> findBySettlementId(UUID settlementId);
}
