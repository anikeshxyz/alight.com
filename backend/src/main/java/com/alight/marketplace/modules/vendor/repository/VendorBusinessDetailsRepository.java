package com.alight.marketplace.modules.vendor.repository;

import com.alight.marketplace.modules.vendor.entity.VendorBusinessDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VendorBusinessDetailsRepository extends JpaRepository<VendorBusinessDetails, UUID> {

    Optional<VendorBusinessDetails> findByVendorId(UUID vendorId);
}
