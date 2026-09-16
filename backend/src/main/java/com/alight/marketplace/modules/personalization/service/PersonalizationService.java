package com.alight.marketplace.modules.personalization.service;

import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.order.entity.OrderStatus;
import com.alight.marketplace.modules.order.repository.OrderItemRepository;
import com.alight.marketplace.modules.personalization.dto.PersonalizationOverviewDto;
import com.alight.marketplace.modules.personalization.entity.RecentlyViewedProduct;
import com.alight.marketplace.modules.personalization.repository.RecentlyViewedProductRepository;
import com.alight.marketplace.modules.product.dto.ProductSummaryDto;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import com.alight.marketplace.modules.product.mapper.ProductMapper;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PersonalizationService {

    private final RecentlyViewedProductRepository recentlyViewedRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductMapper productMapper;

    @Transactional
    public void recordProductView(UUID userId, UUID productId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));

        recentlyViewedRepository.findByUserIdAndProductId(userId, productId).ifPresentOrElse(
                existing -> {
                    existing.setViewedAt(Instant.now());
                    recentlyViewedRepository.save(existing);
                },
                () -> recentlyViewedRepository.save(
                        RecentlyViewedProduct.builder().user(user).product(product).build())
        );
    }

    @Transactional(readOnly = true)
    public List<ProductSummaryDto> getRecentlyViewed(UUID userId) {
        return recentlyViewedRepository.findTop10ByUserIdOrderByViewedAtDesc(userId)
                .stream()
                .map(rv -> productMapper.toSummaryDto(rv.getProduct()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductSummaryDto> getRecommended(UUID userId) {
        // Algorithm: top-rated products in categories the user has recently viewed
        List<RecentlyViewedProduct> recentViews = recentlyViewedRepository.findTop10ByUserIdOrderByViewedAtDesc(userId);

        if (recentViews.isEmpty()) {
            return getTrending();
        }

        // Get categoryIds from recent views
        List<UUID> categoryIds = recentViews.stream()
                .map(rv -> rv.getProduct().getCategory().getId())
                .distinct()
                .collect(Collectors.toList());

        // Get products from same categories, sorted by rating, excluding already-viewed
        List<UUID> viewedProductIds = recentViews.stream()
                .map(rv -> rv.getProduct().getId())
                .collect(Collectors.toList());

        List<Product> recommended = productRepository
                .findByCategoryIdInAndStatus(categoryIds, ProductStatus.ACTIVE,
                        PageRequest.of(0, 16, Sort.by(Sort.Direction.DESC, "averageRating").and(Sort.by(Sort.Direction.DESC, "reviewCount"))))
                .stream()
                .filter(p -> !viewedProductIds.contains(p.getId()))
                .limit(8)
                .collect(Collectors.toList());

        if (recommended.isEmpty()) {
            return getTrending();
        }

        return recommended.stream().map(productMapper::toSummaryDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductSummaryDto> getTrending() {
        // Trending: featured + high-review-count products
        return productRepository.findByFeaturedTrueAndStatus(
                        ProductStatus.ACTIVE, PageRequest.of(0, 8, Sort.by(Sort.Direction.DESC, "reviewCount")))
                .stream()
                .map(productMapper::toSummaryDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PersonalizationOverviewDto getOverview(UUID userId) {
        return PersonalizationOverviewDto.builder()
                .recentlyViewed(getRecentlyViewed(userId))
                .recommended(getRecommended(userId))
                .trending(getTrending())
                .build();
    }
}
