package com.alight.marketplace.modules.settlement.repository;

import com.alight.marketplace.modules.settlement.entity.MarketplaceCommissionInvoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MarketplaceCommissionInvoiceRepository extends JpaRepository<MarketplaceCommissionInvoice, UUID> {

    Optional<MarketplaceCommissionInvoice> findByInvoiceNumber(String invoiceNumber);

    Page<MarketplaceCommissionInvoice> findByVendorIdOrderByCreatedAtDesc(UUID vendorId, Pageable pageable);

    Page<MarketplaceCommissionInvoice> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<MarketplaceCommissionInvoice> findByVendorIdAndPeriodYear(UUID vendorId, int periodYear);
}
