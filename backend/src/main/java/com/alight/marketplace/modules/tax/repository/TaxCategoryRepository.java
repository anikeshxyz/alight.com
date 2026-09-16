package com.alight.marketplace.modules.tax.repository;

import com.alight.marketplace.modules.tax.entity.TaxCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaxCategoryRepository extends JpaRepository<TaxCategory, UUID> {
    Optional<TaxCategory> findByCodeIgnoreCase(String code);
    Optional<TaxCategory> findByHsnSacCode(String hsnSacCode);
    List<TaxCategory> findByIsActiveTrueOrderByNameAsc();
    boolean existsByCodeIgnoreCase(String code);
}
