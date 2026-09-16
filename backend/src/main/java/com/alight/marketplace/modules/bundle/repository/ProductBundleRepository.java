package com.alight.marketplace.modules.bundle.repository;

import com.alight.marketplace.modules.bundle.entity.BundleStatus;
import com.alight.marketplace.modules.bundle.entity.ProductBundle;
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
public interface ProductBundleRepository extends JpaRepository<ProductBundle, UUID> {
    Optional<ProductBundle> findBySlugAndStatus(String slug, BundleStatus status);
    Page<ProductBundle> findByStatus(BundleStatus status, Pageable pageable);
    Page<ProductBundle> findByVendorIdAndStatus(UUID vendorId, BundleStatus status, Pageable pageable);
    Page<ProductBundle> findByVendorId(UUID vendorId, Pageable pageable);
    boolean existsBySlug(String slug);

    @Query("SELECT DISTINCT b FROM ProductBundle b JOIN b.items i WHERE i.product.id = :productId AND b.status = 'ACTIVE'")
    List<ProductBundle> findActiveBundlesByProductId(@Param("productId") UUID productId);
}
