package com.alight.marketplace.modules.category.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryTreeDto {
    private UUID id;
    private String name;
    private String slug;
    private String description;
    private String iconUrl;
    private String bannerUrl;
    private int displayOrder;
    private boolean active;

    @Builder.Default
    private List<CategoryTreeDto> children = new ArrayList<>();
}
