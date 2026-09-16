package com.alight.marketplace.modules.category.mapper;

import com.alight.marketplace.modules.category.dto.BrandDto;
import com.alight.marketplace.modules.category.entity.Brand;
import org.springframework.stereotype.Component;

@Component
public class BrandMapper {

    public BrandDto toBrandDto(Brand brand) {
        if (brand == null) return null;

        return BrandDto.builder()
                .id(brand.getId())
                .name(brand.getName())
                .slug(brand.getSlug())
                .logoUrl(brand.getLogoUrl())
                .websiteUrl(brand.getWebsiteUrl())
                .description(brand.getDescription())
                .featured(brand.isFeatured())
                .active(brand.isActive())
                .createdAt(brand.getCreatedAt())
                .updatedAt(brand.getUpdatedAt())
                .build();
    }
}
