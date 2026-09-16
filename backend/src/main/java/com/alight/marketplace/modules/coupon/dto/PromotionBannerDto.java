package com.alight.marketplace.modules.coupon.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionBannerDto {
    private UUID id;

    @NotBlank(message = "Title is required")
    private String title;

    private String slug;
    private String bannerImageUrl;
    private String bannerTag;
    private String badgeText;
    private String discountText;
    private String targetUrl;
    private Instant startTime;
    private Instant endTime;
    private Boolean isActive;
    private Integer displayOrder;
    private Instant createdAt;
    private Instant updatedAt;
}
