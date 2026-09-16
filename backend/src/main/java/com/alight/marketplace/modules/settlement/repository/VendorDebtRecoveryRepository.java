package com.alight.marketplace.modules.settlement.repository;

import com.alight.marketplace.modules.settlement.entity.VendorDebtRecovery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VendorDebtRecoveryRepository extends JpaRepository<VendorDebtRecovery, UUID> {
    List<VendorDebtRecovery> findByVendorIdAndStatusIn(UUID vendorId, List<String> statuses);
    Page<VendorDebtRecovery> findByVendorIdOrderByCreatedAtDesc(UUID vendorId, Pageable pageable);
    Page<VendorDebtRecovery> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
