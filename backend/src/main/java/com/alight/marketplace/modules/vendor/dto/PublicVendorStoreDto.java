package com.alight.marketplace.modules.vendor.dto;

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
public class PublicVendorStoreDto {
    private UUID id;
    private String storeName;
    private String slug;
    private String description;
    private String logoUrl;
    private String bannerUrl;
    private String supportEmail;
    private String supportPhone;
    private boolean vacationMode;
    private String vacationMessage;
    private String shippingPolicy;
    private String refundPolicy;
    private String privacyPolicy;
    private String customDomain;
    private Instant memberSince;
}
