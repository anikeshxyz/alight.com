package com.alight.marketplace.modules.product.mapper;

import com.alight.marketplace.modules.category.mapper.BrandMapper;
import com.alight.marketplace.modules.category.mapper.CategoryMapper;
import com.alight.marketplace.modules.product.dto.*;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.entity.ProductAttribute;
import com.alight.marketplace.modules.product.entity.ProductImage;
import com.alight.marketplace.modules.product.entity.ProductVariant;
import com.alight.marketplace.modules.vendor.mapper.VendorMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ProductMapper {

    private final CategoryMapper categoryMapper;
    private final BrandMapper brandMapper;
    private final VendorMapper vendorMapper;

    public ProductSummaryDto toSummaryDto(Product product) {
        if (product == null) return null;

        String primaryImageUrl = null;
        if (product.getImages() != null && !product.getImages().isEmpty()) {
            primaryImageUrl = product.getImages().stream()
                    .filter(ProductImage::isPrimary)
                    .map(ProductImage::getImageUrl)
                    .findFirst()
                    .orElse(product.getImages().get(0).getImageUrl());
        }

        return ProductSummaryDto.builder()
                .id(product.getId())
                .title(product.getTitle())
                .slug(product.getSlug())
                .shortDescription(product.getShortDescription())
                .basePrice(product.getBasePrice())
                .discountPrice(product.getDiscountPrice())
                .primaryImageUrl(primaryImageUrl)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .categorySlug(product.getCategory() != null ? product.getCategory().getSlug() : null)
                .brandName(product.getBrand() != null ? product.getBrand().getName() : null)
                .vendorStoreName(product.getVendor() != null ? product.getVendor().getStoreName() : null)
                .vendorSlug(product.getVendor() != null ? product.getVendor().getSlug() : null)
                .stockQuantity(product.getStockQuantity())
                .inStock(product.getStockQuantity() > 0)
                .featured(product.isFeatured())
                .status(product.getStatus())
                .build();
    }

    public ProductDetailDto toDetailDto(Product product) {
        if (product == null) return null;

        List<ProductImageDto> imageDtos = product.getImages() != null
                ? product.getImages().stream().map(this::toImageDto).collect(Collectors.toList())
                : new ArrayList<>();

        List<ProductAttributeDto> attributeDtos = product.getAttributes() != null
                ? product.getAttributes().stream().map(this::toAttributeDto).collect(Collectors.toList())
                : new ArrayList<>();

        List<ProductVariantDto> variantDtos = product.getVariants() != null
                ? product.getVariants().stream().filter(ProductVariant::isActive).map(this::toVariantDto).collect(Collectors.toList())
                : new ArrayList<>();

        return ProductDetailDto.builder()
                .id(product.getId())
                .title(product.getTitle())
                .slug(product.getSlug())
                .shortDescription(product.getShortDescription())
                .description(product.getDescription())
                .basePrice(product.getBasePrice())
                .discountPrice(product.getDiscountPrice())
                .sku(product.getSku())
                .stockQuantity(product.getStockQuantity())
                .lowStockThreshold(product.getLowStockThreshold())
                .hsnCode(product.getHsnCode())
                .tags(product.getTags())
                .inStock(product.getStockQuantity() > 0)
                .status(product.getStatus())
                .featured(product.isFeatured())
                .category(categoryMapper.toCategoryDto(product.getCategory()))
                .brand(brandMapper.toBrandDto(product.getBrand()))
                .vendor(vendorMapper.toPublicVendorStoreDto(product.getVendor()))
                .images(imageDtos)
                .attributes(attributeDtos)
                .variants(variantDtos)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    public ProductResponseDto toResponseDto(Product product) {
        if (product == null) return null;

        List<ProductImageDto> imageDtos = product.getImages() != null
                ? product.getImages().stream().map(this::toImageDto).collect(Collectors.toList())
                : new ArrayList<>();

        List<ProductAttributeDto> attributeDtos = product.getAttributes() != null
                ? product.getAttributes().stream().map(this::toAttributeDto).collect(Collectors.toList())
                : new ArrayList<>();

        List<ProductVariantDto> variantDtos = product.getVariants() != null
                ? product.getVariants().stream().map(this::toVariantDto).collect(Collectors.toList())
                : new ArrayList<>();

        return ProductResponseDto.builder()
                .id(product.getId())
                .vendorId(product.getVendor() != null ? product.getVendor().getId() : null)
                .vendorStoreName(product.getVendor() != null ? product.getVendor().getStoreName() : null)
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .brandId(product.getBrand() != null ? product.getBrand().getId() : null)
                .brandName(product.getBrand() != null ? product.getBrand().getName() : null)
                .title(product.getTitle())
                .slug(product.getSlug())
                .shortDescription(product.getShortDescription())
                .description(product.getDescription())
                .basePrice(product.getBasePrice())
                .discountPrice(product.getDiscountPrice())
                .sku(product.getSku())
                .stockQuantity(product.getStockQuantity())
                .lowStockThreshold(product.getLowStockThreshold())
                .hsnCode(product.getHsnCode())
                .tags(product.getTags())
                .status(product.getStatus())
                .rejectionReason(product.getRejectionReason())
                .featured(product.isFeatured())
                .images(imageDtos)
                .attributes(attributeDtos)
                .variants(variantDtos)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    public ProductImageDto toImageDto(ProductImage image) {
        if (image == null) return null;
        return ProductImageDto.builder()
                .id(image.getId())
                .imageUrl(image.getImageUrl())
                .altText(image.getAltText())
                .displayOrder(image.getDisplayOrder())
                .primary(image.isPrimary())
                .build();
    }

    public ProductAttributeDto toAttributeDto(ProductAttribute attribute) {
        if (attribute == null) return null;
        return ProductAttributeDto.builder()
                .id(attribute.getId())
                .attributeName(attribute.getAttributeName())
                .attributeValue(attribute.getAttributeValue())
                .displayOrder(attribute.getDisplayOrder())
                .build();
    }

    public ProductVariantDto toVariantDto(ProductVariant variant) {
        if (variant == null) return null;
        return ProductVariantDto.builder()
                .id(variant.getId())
                .variantSku(variant.getVariantSku())
                .variantName(variant.getVariantName())
                .price(variant.getPrice())
                .compareAtPrice(variant.getCompareAtPrice())
                .stockQuantity(variant.getStockQuantity())
                .weightGrams(variant.getWeightGrams())
                .barcode(variant.getBarcode())
                .imageUrl(variant.getImageUrl())
                .attributesJson(variant.getAttributesJson())
                .active(variant.isActive())
                .build();
    }
}
