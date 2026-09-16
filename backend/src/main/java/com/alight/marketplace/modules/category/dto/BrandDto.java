package com.alight.marketplace.modules.category.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrandDto {
    private UUID id;
    private String name;
    private String slug;
    private String logoUrl;
    private String websiteUrl;
    private String description;
    private boolean featured;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;
}
