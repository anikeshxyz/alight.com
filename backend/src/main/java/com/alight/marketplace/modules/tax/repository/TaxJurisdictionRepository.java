package com.alight.marketplace.modules.tax.repository;

import com.alight.marketplace.modules.tax.entity.TaxJurisdiction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaxJurisdictionRepository extends JpaRepository<TaxJurisdiction, UUID> {
    List<TaxJurisdiction> findByCountryCodeIgnoreCase(String countryCode);
    Optional<TaxJurisdiction> findByCountryCodeIgnoreCaseAndStateCodeIgnoreCase(String countryCode, String stateCode);
    Optional<TaxJurisdiction> findByCountryCodeIgnoreCaseAndStateCodeIsNull(String countryCode);
    List<TaxJurisdiction> findByIsActiveTrue();
}
