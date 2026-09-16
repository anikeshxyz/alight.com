package com.alight.marketplace.modules.tax.repository;

import com.alight.marketplace.modules.tax.entity.TaxCategory;
import com.alight.marketplace.modules.tax.entity.TaxRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaxRuleRepository extends JpaRepository<TaxRule, UUID> {
    List<TaxRule> findByTaxCategoryAndIsActiveTrue(TaxCategory taxCategory);

    @Query("SELECT r FROM TaxRule r WHERE r.taxCategory = :taxCategory AND r.isActive = true " +
           "AND (:isInterState IS NULL OR r.isInterState IS NULL OR r.isInterState = :isInterState) " +
           "ORDER BY r.priority DESC")
    List<TaxRule> findMatchingRules(
            @Param("taxCategory") TaxCategory taxCategory,
            @Param("isInterState") Boolean isInterState);
}
