package com.alight.marketplace.modules.review.repository;

import com.alight.marketplace.modules.review.entity.Review;
import com.alight.marketplace.modules.review.entity.ReviewStatus;
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
public interface ReviewRepository extends JpaRepository<Review, UUID> {

    Optional<Review> findByProductIdAndUserId(UUID productId, UUID userId);

    boolean existsByProductIdAndUserId(UUID productId, UUID userId);

    Page<Review> findByProductIdAndStatus(UUID productId, ReviewStatus status, Pageable pageable);

    Page<Review> findByVendorId(UUID vendorId, Pageable pageable);

    Page<Review> findByVendorIdAndStatus(UUID vendorId, ReviewStatus status, Pageable pageable);

    Page<Review> findByUserId(UUID userId, Pageable pageable);

    Page<Review> findByStatus(ReviewStatus status, Pageable pageable);

    List<Review> findByProductIdAndStatus(UUID productId, ReviewStatus status);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.vendor.id = :vendorId")
    long countByVendorId(@Param("vendorId") UUID vendorId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.vendor.id = :vendorId AND r.status = 'APPROVED'")
    Double getAverageRatingForVendor(@Param("vendorId") UUID vendorId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId AND r.status = 'APPROVED'")
    Double getAverageRatingForProduct(@Param("productId") UUID productId);

    @Query("SELECT r.rating, COUNT(r) FROM Review r WHERE r.product.id = :productId AND r.status = 'APPROVED' GROUP BY r.rating")
    List<Object[]> getRatingDistributionForProduct(@Param("productId") UUID productId);
}
