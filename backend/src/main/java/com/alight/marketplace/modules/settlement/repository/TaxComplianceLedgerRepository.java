package com.alight.marketplace.modules.settlement.repository;

import com.alight.marketplace.modules.settlement.entity.TaxComplianceLedger;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaxComplianceLedgerRepository extends JpaRepository<TaxComplianceLedger, UUID> {

    Optional<TaxComplianceLedger> findByVendorIdAndFinancialYearAndMonth(UUID vendorId, String financialYear, int month);

    Page<TaxComplianceLedger> findByVendorIdOrderByFinancialYearDescMonthDesc(UUID vendorId, Pageable pageable);

    Page<TaxComplianceLedger> findAllByOrderByFinancialYearDescMonthDesc(Pageable pageable);

    List<TaxComplianceLedger> findByFinancialYearAndQuarter(String financialYear, String quarter);

    List<TaxComplianceLedger> findByVendorIdAndFinancialYear(UUID vendorId, String financialYear);

    @Query("SELECT l FROM TaxComplianceLedger l WHERE l.financialYear = :financialYear AND (:quarter IS NULL OR l.quarter = :quarter)")
    List<TaxComplianceLedger> findForTaxFiling(@Param("financialYear") String financialYear, @Param("quarter") String quarter);
}
