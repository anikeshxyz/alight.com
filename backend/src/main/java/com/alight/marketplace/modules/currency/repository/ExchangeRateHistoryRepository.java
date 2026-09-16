package com.alight.marketplace.modules.currency.repository;

import com.alight.marketplace.modules.currency.entity.ExchangeRateHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExchangeRateHistoryRepository extends JpaRepository<ExchangeRateHistory, UUID> {
    Page<ExchangeRateHistory> findByCurrencyCodeIgnoreCaseOrderByRecordedAtDesc(String currencyCode, Pageable pageable);
    List<ExchangeRateHistory> findTop20ByOrderByRecordedAtDesc();
}
