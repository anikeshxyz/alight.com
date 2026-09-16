package com.alight.marketplace.modules.vendor.repository;

import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.entity.VendorStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VendorRepository extends JpaRepository<Vendor, UUID> {

    Optional<Vendor> findByUserId(UUID userId);

    @Query("SELECT v FROM Vendor v JOIN v.user u WHERE u.email = :email")
    Optional<Vendor> findByUserEmail(@Param("email") String email);

    Optional<Vendor> findBySlug(String slug);

    Optional<Vendor> findBySlugAndStatus(String slug, VendorStatus status);

    boolean existsByStoreName(String storeName);

    boolean existsBySlug(String slug);

    boolean existsByUserId(UUID userId);

    Page<Vendor> findByStatus(VendorStatus status, Pageable pageable);
    long countByStatus(VendorStatus status);

    @Query("SELECT v FROM Vendor v WHERE (:status IS NULL OR v.status = :status) AND " +
           "(:search IS NULL OR LOWER(v.storeName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(v.supportEmail) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    Page<Vendor> searchVendors(@Param("status") VendorStatus status, @Param("search") String search, Pageable pageable);
}
