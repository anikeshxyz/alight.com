package com.alight.marketplace.modules.returns.repository;

import com.alight.marketplace.modules.returns.entity.RmaPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RmaPolicyRepository extends JpaRepository<RmaPolicy, UUID> {

    @Query("SELECT p FROM RmaPolicy p WHERE p.category.id = :categoryId")
    Optional<RmaPolicy> findByCategoryId(@Param("categoryId") UUID categoryId);

    @Query("SELECT p FROM RmaPolicy p WHERE p.vendor.id = :vendorId")
    Optional<RmaPolicy> findByVendorId(@Param("vendorId") UUID vendorId);

    @Query("SELECT p FROM RmaPolicy p WHERE p.category IS NULL AND p.vendor IS NULL")
    Optional<RmaPolicy> findDefaultPolicy();

    List<RmaPolicy> findAllByOrderByCreatedAtDesc();
}
