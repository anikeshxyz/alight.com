package com.alight.marketplace.modules.product.service.impl;

import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.product.dto.ProductDetailDto;
import com.alight.marketplace.modules.product.dto.ProductSummaryDto;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import com.alight.marketplace.modules.product.mapper.ProductMapper;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.product.service.ProductService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<ProductSummaryDto> searchProducts(
            String categoryIdentifier,
            UUID brandId,
            UUID vendorId,
            String search,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean inStockOnly,
            Pageable pageable
    ) {
        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Always restrict to ACTIVE products on public storefront
            predicates.add(cb.equal(root.get("status"), ProductStatus.ACTIVE));

            if (categoryIdentifier != null && !categoryIdentifier.trim().isEmpty()) {
                String cleanCat = categoryIdentifier.trim();
                try {
                    UUID catUuid = UUID.fromString(cleanCat);
                    Predicate directCat = cb.equal(root.get("category").get("id"), catUuid);
                    Predicate parentCat = cb.equal(root.get("category").get("parent").get("id"), catUuid);
                    predicates.add(cb.or(directCat, parentCat));
                } catch (IllegalArgumentException e) {
                    // It's a slug
                    Predicate directSlug = cb.equal(cb.lower(root.get("category").get("slug")), cleanCat.toLowerCase());
                    Predicate parentSlug = cb.equal(cb.lower(root.get("category").get("parent").get("slug")), cleanCat.toLowerCase());
                    predicates.add(cb.or(directSlug, parentSlug));
                }
            }

            if (brandId != null) {
                predicates.add(cb.equal(root.get("brand").get("id"), brandId));
            }

            if (vendorId != null) {
                predicates.add(cb.equal(root.get("vendor").get("id"), vendorId));
            }

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                Predicate skuMatch = cb.like(cb.lower(root.get("sku")), pattern);
                Predicate shortDescMatch = cb.like(cb.lower(cb.coalesce(root.get("shortDescription"), "")), pattern);
                Predicate descMatch = cb.like(cb.lower(cb.coalesce(root.get("description"), "")), pattern);
                predicates.add(cb.or(titleMatch, skuMatch, shortDescMatch, descMatch));
            }

            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("basePrice"), minPrice));
            }

            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("basePrice"), maxPrice));
            }

            if (Boolean.TRUE.equals(inStockOnly)) {
                predicates.add(cb.greaterThan(root.get("stockQuantity"), 0));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return productRepository.findAll(spec, pageable)
                .map(productMapper::toSummaryDto);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDetailDto getProductBySlug(String slug) {
        Product product = productRepository.findBySlugAndStatus(slug, ProductStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with slug: " + slug));
        return productMapper.toDetailDto(product);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductSummaryDto> getFeaturedProducts(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return productRepository.findByFeaturedTrueAndStatus(ProductStatus.ACTIVE, pageable)
                .stream()
                .map(productMapper::toSummaryDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductSummaryDto> getRelatedProducts(String slug, int limit) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with slug: " + slug));

        if (product.getCategory() == null) {
            return List.of();
        }

        Pageable pageable = PageRequest.of(0, limit + 1);
        return productRepository.searchActiveProducts(
                ProductStatus.ACTIVE,
                product.getCategory().getId(),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                pageable
        ).stream()
                .filter(p -> !p.getId().equals(product.getId()))
                .limit(limit)
                .map(productMapper::toSummaryDto)
                .toList();
    }
}
