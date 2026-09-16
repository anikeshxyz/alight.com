package com.alight.marketplace.modules.currency.repository;

import com.alight.marketplace.modules.currency.entity.Currency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CurrencyRepository extends JpaRepository<Currency, UUID> {
    Optional<Currency> findByCodeIgnoreCase(String code);
    Optional<Currency> findByIsBaseTrue();
    List<Currency> findByIsActiveTrueOrderByCodeAsc();
    boolean existsByCodeIgnoreCase(String code);
}
