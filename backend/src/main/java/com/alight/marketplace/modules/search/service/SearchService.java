package com.alight.marketplace.modules.search.service;

import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.entity.ProductImage;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import com.alight.marketplace.modules.product.mapper.ProductMapper;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.search.dto.SearchFacetsDto;
import com.alight.marketplace.modules.search.dto.SearchResultDto;
import com.alight.marketplace.modules.search.dto.SearchSuggestionDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SearchService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    public SearchResultDto search(String query, UUID categoryId, UUID brandId, UUID vendorId,
                                  BigDecimal minPrice, BigDecimal maxPrice, Integer minRating,
                                  Boolean inStock, String sort, int page, int size) {

        Sort sortOrder = buildSort(sort);
        Pageable pageable = PageRequest.of(page, size, sortOrder);

        Page<Product> results = productRepository.searchActiveProducts(
                ProductStatus.ACTIVE, categoryId, brandId, vendorId,
                (query != null && !query.isBlank()) ? query.trim() : null,
                minPrice, maxPrice,
                minRating == null ? null : BigDecimal.valueOf(minRating),
                inStock,
                pageable);

        // Build facets from the resulting page content
        Map<String, Long> categoryFacets = results.getContent().stream()
                .filter(p -> p.getCategory() != null)
                .collect(Collectors.groupingBy(p -> p.getCategory().getName(), Collectors.counting()));

        Map<String, Long> brandFacets = results.getContent().stream()
                .filter(p -> p.getBrand() != null)
                .collect(Collectors.groupingBy(p -> p.getBrand().getName(), Collectors.counting()));

        Map<String, Long> vendorFacets = results.getContent().stream()
                .filter(p -> p.getVendor() != null)
                .collect(Collectors.groupingBy(p -> p.getVendor().getStoreName(), Collectors.counting()));

        long inStockCount = results.getContent().stream()
                .filter(p -> p.getStockQuantity() > 0)
                .count();

        long outOfStockCount = results.getContent().stream()
                .filter(p -> p.getStockQuantity() == 0)
                .count();

        BigDecimal minP = results.getContent().stream()
                .map(p -> p.getDiscountPrice() != null ? p.getDiscountPrice() : p.getBasePrice())
                .min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);

        BigDecimal maxP = results.getContent().stream()
                .map(p -> p.getDiscountPrice() != null ? p.getDiscountPrice() : p.getBasePrice())
                .max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);

        SearchFacetsDto facets = SearchFacetsDto.builder()
                .categories(categoryFacets)
                .brands(brandFacets)
                .vendors(vendorFacets)
                .minPrice(minP)
                .maxPrice(maxP)
                .inStockCount(inStockCount)
                .outOfStockCount(outOfStockCount)
                .totalResults(results.getTotalElements())
                .build();

        return SearchResultDto.builder()
                .products(results.getContent().stream().map(productMapper::toSummaryDto).collect(Collectors.toList()))
                .page(results.getNumber())
                .size(results.getSize())
                .totalElements(results.getTotalElements())
                .totalPages(results.getTotalPages())
                .query(query)
                .facets(facets)
                .build();
    }

    public List<SearchSuggestionDto> getSuggestions(String query) {
        if (query == null || query.isBlank() || query.length() < 2) return List.of();

        Pageable pageable = PageRequest.of(0, 8, Sort.by(Sort.Direction.DESC, "reviewCount"));
        Page<Product> products = productRepository.searchActiveProducts(
                ProductStatus.ACTIVE, null, null, null, query.trim(), null, null, null, null, pageable);

        return products.getContent().stream().map(p -> {
            String imageUrl = null;
            if (p.getImages() != null && !p.getImages().isEmpty()) {
                imageUrl = p.getImages().stream()
                        .filter(ProductImage::isPrimary)
                        .map(ProductImage::getImageUrl)
                        .findFirst()
                        .orElse(p.getImages().get(0).getImageUrl());
            }
            return SearchSuggestionDto.builder()
                    .title(p.getTitle())
                    .slug(p.getSlug())
                    .primaryImageUrl(imageUrl)
                    .price(p.getDiscountPrice() != null ? p.getDiscountPrice() : p.getBasePrice())
                    .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                    .build();
        }).collect(Collectors.toList());
    }

    private Sort buildSort(String sort) {
        if (sort == null) return Sort.by(Sort.Direction.DESC, "reviewCount");
        return switch (sort.toLowerCase()) {
            case "price_asc", "price_low_to_high" -> Sort.by(Sort.Direction.ASC, "basePrice");
            case "price_desc", "price_high_to_low" -> Sort.by(Sort.Direction.DESC, "basePrice");
            case "rating", "top_rated" -> Sort.by(Sort.Direction.DESC, "averageRating");
            case "newest" -> Sort.by(Sort.Direction.DESC, "createdAt");
            default -> Sort.by(Sort.Direction.DESC, "reviewCount");
        };
    }
}
