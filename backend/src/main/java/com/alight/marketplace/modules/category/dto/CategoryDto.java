package com.alight.marketplace.modules.category.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDto {
    private UUID id;
    private UUID parentId;
    private String parentName;
    private String name;
    private String slug;
    private String description;
    private String iconUrl;
    private String bannerUrl;
    private BigDecimal commissionPercentage;
    private int displayOrder;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;
}
