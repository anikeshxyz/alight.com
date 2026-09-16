package com.alight.marketplace.modules.vendor.mapper;

import com.alight.marketplace.modules.vendor.dto.PublicVendorStoreDto;
import com.alight.marketplace.modules.vendor.dto.VendorBusinessDetailsDto;
import com.alight.marketplace.modules.vendor.dto.VendorPickupAddressDto;
import com.alight.marketplace.modules.vendor.dto.VendorResponseDto;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.entity.VendorBusinessDetails;
import com.alight.marketplace.modules.vendor.entity.VendorPickupAddress;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class VendorMapper {

    public VendorResponseDto toVendorResponseDto(Vendor vendor) {
        if (vendor == null) return null;

        VendorBusinessDetailsDto businessDto = null;
        if (vendor.getBusinessDetails() != null) {
            businessDto = toBusinessDetailsDto(vendor.getBusinessDetails());
        }

        List<VendorPickupAddressDto> pickupDtos = null;
        if (vendor.getPickupAddresses() != null) {
            pickupDtos = vendor.getPickupAddresses().stream()
                    .map(this::toPickupAddressDto)
                    .toList();
        }

        return VendorResponseDto.builder()
                .id(vendor.getId())
                .userId(vendor.getUser() != null ? vendor.getUser().getId() : null)
                .userEmail(vendor.getUser() != null ? vendor.getUser().getEmail() : null)
                .storeName(vendor.getStoreName())
                .slug(vendor.getSlug())
                .description(vendor.getDescription())
                .logoUrl(vendor.getLogoUrl())
                .bannerUrl(vendor.getBannerUrl())
                .supportEmail(vendor.getSupportEmail())
                .supportPhone(vendor.getSupportPhone())
                .commissionPercentage(vendor.getCommissionPercentage())
                .status(vendor.getStatus())
                .rejectionReason(vendor.getRejectionReason())
                .vacationMode(vendor.isVacationMode())
                .vacationMessage(vendor.getVacationMessage())
                .shippingPolicy(vendor.getShippingPolicy())
                .refundPolicy(vendor.getRefundPolicy())
                .privacyPolicy(vendor.getPrivacyPolicy())
                .customDomain(vendor.getCustomDomain())
                .onboardingStep(vendor.getOnboardingStep())
                .autoAcceptOrders(vendor.isAutoAcceptOrders())
                .minimumOrderAmount(vendor.getMinimumOrderAmount())
                .businessDetails(businessDto)
                .pickupAddresses(pickupDtos)
                .createdAt(vendor.getCreatedAt())
                .updatedAt(vendor.getUpdatedAt())
                .build();
    }

    public VendorBusinessDetailsDto toBusinessDetailsDto(VendorBusinessDetails details) {
        if (details == null) return null;

        return VendorBusinessDetailsDto.builder()
                .id(details.getId())
                .legalBusinessName(details.getLegalBusinessName())
                .businessType(details.getBusinessType())
                .taxIdGstin(details.getTaxIdGstin())
                .panNumber(details.getPanNumber())
                .bankAccountNumber(details.getBankAccountNumber())
                .bankIfscCode(details.getBankIfscCode())
                .bankName(details.getBankName())
                .bankAccountHolderName(details.getBankAccountHolderName())
                .businessLicenseUrl(details.getBusinessLicenseUrl())
                .taxCertificateUrl(details.getTaxCertificateUrl())
                .idProofUrl(details.getIdProofUrl())
                .verified(details.isVerified())
                .createdAt(details.getCreatedAt())
                .updatedAt(details.getUpdatedAt())
                .build();
    }

    public VendorPickupAddressDto toPickupAddressDto(VendorPickupAddress address) {
        if (address == null) return null;

        return VendorPickupAddressDto.builder()
                .id(address.getId())
                .contactPerson(address.getContactPerson())
                .contactPhone(address.getContactPhone())
                .addressLine1(address.getAddressLine1())
                .addressLine2(address.getAddressLine2())
                .city(address.getCity())
                .state(address.getState())
                .postalCode(address.getPostalCode())
                .country(address.getCountry())
                .primary(address.isPrimary())
                .createdAt(address.getCreatedAt())
                .updatedAt(address.getUpdatedAt())
                .build();
    }

    public PublicVendorStoreDto toPublicVendorStoreDto(Vendor vendor) {
        if (vendor == null) return null;

        return PublicVendorStoreDto.builder()
                .id(vendor.getId())
                .storeName(vendor.getStoreName())
                .slug(vendor.getSlug())
                .description(vendor.getDescription())
                .logoUrl(vendor.getLogoUrl())
                .bannerUrl(vendor.getBannerUrl())
                .supportEmail(vendor.getSupportEmail())
                .supportPhone(vendor.getSupportPhone())
                .vacationMode(vendor.isVacationMode())
                .vacationMessage(vendor.getVacationMessage())
                .shippingPolicy(vendor.getShippingPolicy())
                .refundPolicy(vendor.getRefundPolicy())
                .privacyPolicy(vendor.getPrivacyPolicy())
                .customDomain(vendor.getCustomDomain())
                .memberSince(vendor.getCreatedAt())
                .build();
    }
}
