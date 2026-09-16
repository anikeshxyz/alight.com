package com.alight.marketplace.modules.product.repository;

import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    Optional<Product> findBySlug(String slug);

    Optional<Product> findBySlugAndStatus(String slug, ProductStatus status);

    boolean existsBySlug(String slug);

    boolean existsBySku(String sku);

    Page<Product> findByVendorId(UUID vendorId, Pageable pageable);

    Page<Product> findByVendorIdAndStatus(UUID vendorId, ProductStatus status, Pageable pageable);

    List<Product> findByFeaturedTrueAndStatus(ProductStatus status, Pageable pageable);

    List<Product> findByCategoryIdInAndStatus(List<UUID> categoryIds, ProductStatus status, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.status = :status AND " +
           "(:categoryId IS NULL OR p.category.id = :categoryId OR p.category.parent.id = :categoryId) AND " +
           "(:brandId IS NULL OR p.brand.id = :brandId) AND " +
           "(:vendorId IS NULL OR p.vendor.id = :vendorId) AND " +
           "(:search IS NULL OR " +
           " LOWER(p.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           " LOWER(COALESCE(p.shortDescription, '')) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           " LOWER(COALESCE(p.description, '')) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           " LOWER(p.sku) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           " LOWER(COALESCE(p.tags, '')) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           " LOWER(p.category.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           " (p.brand IS NOT NULL AND LOWER(p.brand.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) OR " +
           " LOWER(p.vendor.storeName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) AND " +
           "(:minPrice IS NULL OR COALESCE(p.discountPrice, p.basePrice) >= :minPrice) AND " +
           "(:maxPrice IS NULL OR COALESCE(p.discountPrice, p.basePrice) <= :maxPrice) AND " +
           "(:minRating IS NULL OR p.averageRating >= :minRating) AND " +
           "(:inStock IS NULL OR (:inStock = true AND p.stockQuantity > 0) OR (:inStock = false AND p.stockQuantity = 0))")
    Page<Product> searchActiveProducts(
            @Param("status") ProductStatus status,
            @Param("categoryId") UUID categoryId,
            @Param("brandId") UUID brandId,
            @Param("vendorId") UUID vendorId,
            @Param("search") String search,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("minRating") BigDecimal minRating,
            @Param("inStock") Boolean inStock,
            Pageable pageable
    );
}
