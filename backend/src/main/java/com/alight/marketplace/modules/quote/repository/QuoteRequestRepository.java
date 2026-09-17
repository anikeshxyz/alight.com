package com.alight.marketplace.modules.quote.repository;

import com.alight.marketplace.modules.quote.entity.QuoteRequest;
import com.alight.marketplace.modules.quote.entity.QuoteStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuoteRequestRepository extends JpaRepository<QuoteRequest, UUID> {
    Optional<QuoteRequest> findByQuoteNumber(String quoteNumber);
    Page<QuoteRequest> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    long countByUserIdAndStatusIn(UUID userId, java.util.List<QuoteStatus> statuses);
    Page<QuoteRequest> findByVendorIdOrderByCreatedAtDesc(UUID vendorId, Pageable pageable);
    Page<QuoteRequest> findByVendorIdAndStatusOrderByCreatedAtDesc(UUID vendorId, QuoteStatus status, Pageable pageable);
    long countByVendorIdAndStatus(UUID vendorId, QuoteStatus status);
}
