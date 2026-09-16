package com.alight.marketplace.modules.vendor.service;

import com.alight.marketplace.modules.vendor.dto.*;

import java.util.List;
import java.util.UUID;

public interface VendorService {

    VendorResponseDto applyAsVendor(String userEmail, VendorApplicationRequest request);

    VendorResponseDto getCurrentVendor(String userEmail);

    VendorResponseDto updateVendorProfile(String userEmail, UpdateVendorProfileRequest request);

    VendorResponseDto updateStoreSettings(String userEmail, UpdateStoreSettingsRequest request);

    VendorBusinessDetailsDto updateBusinessDetails(String userEmail, UpdateBusinessDetailsRequest request);

    VendorBusinessDetailsDto updateKycDocuments(String userEmail, UpdateKycDocumentsRequest request);

    VendorResponseDto toggleVacationMode(String userEmail, boolean vacationMode, String vacationMessage);

    List<VendorPickupAddressDto> getPickupAddresses(String userEmail);

    VendorPickupAddressDto addPickupAddress(String userEmail, CreatePickupAddressRequest request);

    VendorPickupAddressDto setPrimaryPickupAddress(String userEmail, UUID addressId);

    void deletePickupAddress(String userEmail, UUID addressId);

    PublicVendorStoreDto getPublicStoreBySlug(String slug);
}
