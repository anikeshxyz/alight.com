package com.alight.marketplace.modules.vendor.dto;

import com.alight.marketplace.modules.vendor.entity.VendorStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorResponseDto {
    private UUID id;
    private UUID userId;
    private String userEmail;
    private String storeName;
    private String slug;
    private String description;
    private String logoUrl;
    private String bannerUrl;
    private String supportEmail;
    private String supportPhone;
    private BigDecimal commissionPercentage;
    private VendorStatus status;
    private String rejectionReason;
    private boolean vacationMode;
    private String vacationMessage;
    private String shippingPolicy;
    private String refundPolicy;
    private String privacyPolicy;
    private String customDomain;
    private String onboardingStep;
    private boolean autoAcceptOrders;
    private BigDecimal minimumOrderAmount;
    private VendorBusinessDetailsDto businessDetails;
    private List<VendorPickupAddressDto> pickupAddresses;
    private Instant createdAt;
    private Instant updatedAt;
}
