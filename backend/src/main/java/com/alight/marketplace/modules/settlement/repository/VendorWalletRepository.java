package com.alight.marketplace.modules.settlement.repository;

import com.alight.marketplace.modules.settlement.entity.VendorWallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VendorWalletRepository extends JpaRepository<VendorWallet, UUID> {
    Optional<VendorWallet> findByVendorId(UUID vendorId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM VendorWallet w WHERE w.vendor.id = :vendorId")
    Optional<VendorWallet> findByVendorIdForUpdate(@Param("vendorId") UUID vendorId);
}
