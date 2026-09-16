package com.alight.marketplace.modules.coupon.repository;

import com.alight.marketplace.modules.coupon.entity.Coupon;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, UUID> {

    Optional<Coupon> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    @Query("SELECT c FROM Coupon c " +
           "WHERE c.isActive = true " +
           "AND c.validFrom <= :now " +
           "AND (c.validUntil IS NULL OR c.validUntil >= :now) " +
           "AND (c.usageLimitTotal IS NULL OR c.totalUsedCount < c.usageLimitTotal) " +
           "ORDER BY c.createdAt DESC")
    List<Coupon> findActivePublicCoupons(@Param("now") Instant now);

    Page<Coupon> findByVendorIdOrderByCreatedAtDesc(UUID vendorId, Pageable pageable);

    @Query("SELECT c FROM Coupon c " +
           "WHERE (:activeOnly IS NULL OR c.isActive = :activeOnly) " +
           "AND (:searchTerm IS NULL OR LOWER(c.code) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%')) " +
           "     OR LOWER(c.title) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%')))")
    Page<Coupon> searchAllAdmin(@Param("searchTerm") String searchTerm,
                                @Param("activeOnly") Boolean activeOnly,
                                Pageable pageable);

    long countByVendorId(UUID vendorId);

    long countByVendorIdAndIsActiveTrue(UUID vendorId);
}
