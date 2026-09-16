package com.alight.marketplace.modules.bundle.service;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.bundle.dto.*;
import com.alight.marketplace.modules.bundle.entity.*;
import com.alight.marketplace.modules.bundle.repository.ProductBundleRepository;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.entity.ProductImage;
import com.alight.marketplace.modules.product.mapper.ProductMapper;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BundleService {

    private final ProductBundleRepository bundleRepository;
    private final ProductRepository productRepository;
    private final VendorRepository vendorRepository;
    private final ProductMapper productMapper;

    @Transactional(readOnly = true)
    public Page<BundleSummaryDto> getActiveBundles(Pageable pageable) {
        return bundleRepository.findByStatus(BundleStatus.ACTIVE, pageable)
                .map(this::toBundleSummaryDto);
    }

    @Transactional(readOnly = true)
    public BundleDto getBundleBySlug(String slug) {
        ProductBundle bundle = bundleRepository.findBySlugAndStatus(slug, BundleStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Bundle not found: " + slug));
        return toBundleDto(bundle);
    }

    @Transactional(readOnly = true)
    public List<BundleSummaryDto> getBundlesContainingProduct(UUID productId) {
        return bundleRepository.findActiveBundlesByProductId(productId)
                .stream().map(this::toBundleSummaryDto).collect(Collectors.toList());
    }

    @Transactional
    public BundleDto createBundle(CreateBundleRequest request, String createdByEmail, UUID vendorId) {
        String slug = generateSlug(request.getTitle());
        if (bundleRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis();
        }

        BundleDiscountType discountType = BundleDiscountType.valueOf(request.getDiscountType().toUpperCase());

        Vendor vendor = null;
        if (vendorId != null) {
            vendor = vendorRepository.findById(vendorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Vendor not found: " + vendorId));
        }

        ProductBundle bundle = ProductBundle.builder()
                .title(request.getTitle())
                .slug(slug)
                .description(request.getDescription())
                .discountType(discountType)
                .discountValue(request.getDiscountValue())
                .status(BundleStatus.ACTIVE)
                .vendor(vendor)
                .createdBy(createdByEmail)
                .build();

        for (CreateBundleRequest.BundleItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemReq.getProductId()));
            ProductBundleItem item = ProductBundleItem.builder()
                    .bundle(bundle)
                    .product(product)
                    .quantity(Math.max(1, itemReq.getQuantity()))
                    .build();
            bundle.getItems().add(item);
        }

        ProductBundle saved = bundleRepository.save(bundle);
        log.info("Created bundle '{}' with {} items by {}", saved.getTitle(), saved.getItems().size(), createdByEmail);
        return toBundleDto(saved);
    }

    @Transactional
    public BundleDto updateBundleStatus(UUID bundleId, BundleStatus newStatus, String email) {
        ProductBundle bundle = bundleRepository.findById(bundleId)
                .orElseThrow(() -> new ResourceNotFoundException("Bundle not found: " + bundleId));
        bundle.setStatus(newStatus);
        return toBundleDto(bundleRepository.save(bundle));
    }

    @Transactional(readOnly = true)
    public Page<BundleSummaryDto> getVendorBundles(UUID vendorId, Pageable pageable) {
        return bundleRepository.findByVendorId(vendorId, pageable).map(this::toBundleSummaryDto);
    }

    @Transactional(readOnly = true)
    public Page<BundleSummaryDto> getAllBundlesAdmin(Pageable pageable) {
        return bundleRepository.findAll(pageable).map(this::toBundleSummaryDto);
    }

    // ---- Private Mapping Helpers ----

    private BundleDto toBundleDto(ProductBundle bundle) {
        List<BundleItemDto> itemDtos = bundle.getItems().stream().map(item -> {
            BigDecimal lineTotal = (item.getProduct().getDiscountPrice() != null
                    ? item.getProduct().getDiscountPrice()
                    : item.getProduct().getBasePrice())
                    .multiply(BigDecimal.valueOf(item.getQuantity()));
            return BundleItemDto.builder()
                    .id(item.getId())
                    .productId(item.getProduct().getId())
                    .product(productMapper.toSummaryDto(item.getProduct()))
                    .quantity(item.getQuantity())
                    .lineTotal(lineTotal)
                    .build();
        }).collect(Collectors.toList());

        BigDecimal originalTotal = itemDtos.stream()
                .map(BundleItemDto::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal discounted = calculateDiscounted(originalTotal, bundle.getDiscountType(), bundle.getDiscountValue());
        BigDecimal savings = originalTotal.subtract(discounted);

        return BundleDto.builder()
                .id(bundle.getId())
                .title(bundle.getTitle())
                .slug(bundle.getSlug())
                .description(bundle.getDescription())
                .discountType(bundle.getDiscountType())
                .discountValue(bundle.getDiscountValue())
                .status(bundle.getStatus())
                .vendorStoreName(bundle.getVendor() != null ? bundle.getVendor().getStoreName() : "Alight Marketplace")
                .totalOriginalPrice(originalTotal)
                .totalDiscountedPrice(discounted)
                .totalSavings(savings)
                .itemCount(itemDtos.size())
                .items(itemDtos)
                .createdAt(bundle.getCreatedAt())
                .build();
    }

    private BundleSummaryDto toBundleSummaryDto(ProductBundle bundle) {
        BigDecimal originalTotal = bundle.getItems().stream().map(item -> {
            BigDecimal price = item.getProduct().getDiscountPrice() != null
                    ? item.getProduct().getDiscountPrice() : item.getProduct().getBasePrice();
            return price.multiply(BigDecimal.valueOf(item.getQuantity()));
        }).reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal discounted = calculateDiscounted(originalTotal, bundle.getDiscountType(), bundle.getDiscountValue());

        String primaryImage = bundle.getItems().stream()
                .findFirst()
                .map(item -> item.getProduct().getImages().stream()
                        .filter(ProductImage::isPrimary)
                        .map(ProductImage::getImageUrl)
                        .findFirst()
                        .orElse(item.getProduct().getImages().isEmpty() ? null : item.getProduct().getImages().get(0).getImageUrl()))
                .orElse(null);

        return BundleSummaryDto.builder()
                .id(bundle.getId())
                .title(bundle.getTitle())
                .slug(bundle.getSlug())
                .description(bundle.getDescription())
                .discountType(bundle.getDiscountType())
                .discountValue(bundle.getDiscountValue())
                .totalOriginalPrice(originalTotal)
                .totalDiscountedPrice(discounted)
                .totalSavings(originalTotal.subtract(discounted))
                .itemCount(bundle.getItems().size())
                .primaryImageUrl(primaryImage)
                .createdAt(bundle.getCreatedAt())
                .build();
    }

    private BigDecimal calculateDiscounted(BigDecimal original, BundleDiscountType type, BigDecimal value) {
        if (type == BundleDiscountType.PERCENT) {
            BigDecimal discount = original.multiply(value).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            return original.subtract(discount).max(BigDecimal.ZERO);
        } else {
            return original.subtract(value).max(BigDecimal.ZERO);
        }
    }

    private String generateSlug(String title) {
        return title.toLowerCase().replaceAll("[^a-z0-9\\s-]", "").replaceAll("\\s+", "-").replaceAll("-+", "-");
    }
}
