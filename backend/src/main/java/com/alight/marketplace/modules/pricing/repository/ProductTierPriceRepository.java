package com.alight.marketplace.modules.pricing.repository;

import com.alight.marketplace.modules.pricing.entity.ProductTierPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductTierPriceRepository extends JpaRepository<ProductTierPrice, UUID> {

    List<ProductTierPrice> findByProductIdOrderByMinQuantityAsc(UUID productId);

    List<ProductTierPrice> findByProductIdAndVariantIdOrderByMinQuantityAsc(UUID productId, UUID variantId);

    @Query("SELECT tp FROM ProductTierPrice tp WHERE tp.product.id = :productId " +
           "AND (:variantId IS NULL OR tp.variant.id = :variantId OR tp.variant IS NULL) " +
           "AND tp.minQuantity <= :quantity " +
           "AND (tp.maxQuantity IS NULL OR tp.maxQuantity >= :quantity) " +
           "ORDER BY tp.minQuantity DESC")
    List<ProductTierPrice> findMatchingTiers(
            @Param("productId") UUID productId,
            @Param("variantId") UUID variantId,
            @Param("quantity") int quantity);
}
