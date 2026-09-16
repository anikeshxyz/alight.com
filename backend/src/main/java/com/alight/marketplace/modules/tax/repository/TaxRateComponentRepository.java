package com.alight.marketplace.modules.tax.repository;

import com.alight.marketplace.modules.tax.entity.TaxRateComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TaxRateComponentRepository extends JpaRepository<TaxRateComponent, UUID> {
}
