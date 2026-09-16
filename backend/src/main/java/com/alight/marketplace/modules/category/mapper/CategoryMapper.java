package com.alight.marketplace.modules.category.mapper;

import com.alight.marketplace.modules.category.dto.CategoryDto;
import com.alight.marketplace.modules.category.dto.CategoryTreeDto;
import com.alight.marketplace.modules.category.entity.Category;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class CategoryMapper {

    public CategoryDto toCategoryDto(Category category) {
        if (category == null) return null;

        return CategoryDto.builder()
                .id(category.getId())
                .parentId(category.getParent() != null ? category.getParent().getId() : null)
                .parentName(category.getParent() != null ? category.getParent().getName() : null)
                .name(category.getName())
                .slug(category.getSlug())
                .description(category.getDescription())
                .iconUrl(category.getIconUrl())
                .bannerUrl(category.getBannerUrl())
                .commissionPercentage(category.getCommissionPercentage())
                .displayOrder(category.getDisplayOrder())
                .active(category.isActive())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }

    public CategoryTreeDto toCategoryTreeDto(Category category, boolean activeOnly) {
        if (category == null) return null;

        CategoryTreeDto dto = CategoryTreeDto.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .description(category.getDescription())
                .iconUrl(category.getIconUrl())
                .bannerUrl(category.getBannerUrl())
                .displayOrder(category.getDisplayOrder())
                .active(category.isActive())
                .build();

        if (category.getChildren() != null) {
            dto.setChildren(category.getChildren().stream()
                    .filter(child -> !activeOnly || child.isActive())
                    .map(child -> toCategoryTreeDto(child, activeOnly))
                    .collect(Collectors.toList()));
        }

        return dto;
    }
}
