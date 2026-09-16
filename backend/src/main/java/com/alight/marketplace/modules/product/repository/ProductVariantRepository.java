package com.alight.marketplace.modules.product.repository;

import com.alight.marketplace.modules.product.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, UUID> {

    List<ProductVariant> findByProductIdOrderByCreatedAtAsc(UUID productId);

    Optional<ProductVariant> findByVariantSku(String variantSku);

    boolean existsByVariantSku(String variantSku);

    void deleteByProductId(UUID productId);
}
