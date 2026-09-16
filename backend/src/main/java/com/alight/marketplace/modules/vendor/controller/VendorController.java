package com.alight.marketplace.modules.vendor.controller;

import com.alight.marketplace.common.exception.UnauthorizedException;
import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.vendor.dto.*;
import com.alight.marketplace.modules.vendor.service.VendorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vendors")
@RequiredArgsConstructor
@Tag(name = "Vendor Management", description = "Endpoints for seller onboarding, KYC verification, store policies, vacation mode, and public storefronts")
public class VendorController {

    private final VendorService vendorService;

    private String getAuthenticatedEmail(Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new UnauthorizedException("Authentication required to access vendor resources");
        }
        return principal.getName();
    }

    @PostMapping("/apply")
    @Operation(summary = "Apply as vendor", description = "Submits a new vendor onboarding application with KYC and pickup address")
    public ResponseEntity<ApiResponse<VendorResponseDto>> applyAsVendor(
            Principal principal,
            @Valid @RequestBody VendorApplicationRequest request
    ) {
        String email = getAuthenticatedEmail(principal);
        VendorResponseDto vendor = vendorService.applyAsVendor(email, request);
        return new ResponseEntity<>(ApiResponse.success(vendor, "Vendor application submitted successfully"), HttpStatus.CREATED);
    }

    @GetMapping("/me")
    @Operation(summary = "Get current vendor profile", description = "Returns the seller profile for the authenticated vendor")
    public ResponseEntity<ApiResponse<VendorResponseDto>> getCurrentVendor(Principal principal) {
        String email = getAuthenticatedEmail(principal);
        VendorResponseDto vendor = vendorService.getCurrentVendor(email);
        return ResponseEntity.ok(ApiResponse.success(vendor));
    }

    @PutMapping("/me")
    @Operation(summary = "Update vendor store profile", description = "Updates store information (name, logo, banner, contact info)")
    public ResponseEntity<ApiResponse<VendorResponseDto>> updateVendorProfile(
            Principal principal,
            @Valid @RequestBody UpdateVendorProfileRequest request
    ) {
        String email = getAuthenticatedEmail(principal);
        VendorResponseDto updated = vendorService.updateVendorProfile(email, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Vendor profile updated successfully"));
    }

    @PutMapping("/me/settings")
    @Operation(summary = "Update store settings and policies", description = "Updates store vacation mode, custom domain, shipping and refund policies")
    public ResponseEntity<ApiResponse<VendorResponseDto>> updateStoreSettings(
            Principal principal,
            @Valid @RequestBody UpdateStoreSettingsRequest request
    ) {
        String email = getAuthenticatedEmail(principal);
        VendorResponseDto updated = vendorService.updateStoreSettings(email, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Store settings and policies updated successfully"));
    }

    @PutMapping("/me/business-details")
    @Operation(summary = "Update vendor business & bank details", description = "Updates tax GSTIN, PAN, and payout bank account details")
    public ResponseEntity<ApiResponse<VendorBusinessDetailsDto>> updateBusinessDetails(
            Principal principal,
            @Valid @RequestBody UpdateBusinessDetailsRequest request
    ) {
        String email = getAuthenticatedEmail(principal);
        VendorBusinessDetailsDto updated = vendorService.updateBusinessDetails(email, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Business details updated successfully"));
    }

    @PutMapping("/me/kyc-documents")
    @Operation(summary = "Upload or update KYC verification documents", description = "Updates URLs for business license, tax certificate, and identity proof")
    public ResponseEntity<ApiResponse<VendorBusinessDetailsDto>> updateKycDocuments(
            Principal principal,
            @Valid @RequestBody UpdateKycDocumentsRequest request
    ) {
        String email = getAuthenticatedEmail(principal);
        VendorBusinessDetailsDto updated = vendorService.updateKycDocuments(email, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "KYC verification documents updated successfully"));
    }

    @PostMapping("/me/vacation-mode")
    @Operation(summary = "Toggle store vacation mode", description = "Enables or disables vacation mode for the seller storefront with an optional customer notice")
    public ResponseEntity<ApiResponse<VendorResponseDto>> toggleVacationMode(
            Principal principal,
            @RequestBody Map<String, Object> body
    ) {
        String email = getAuthenticatedEmail(principal);
        boolean vacationMode = body.get("vacationMode") instanceof Boolean ? (Boolean) body.get("vacationMode") : false;
        String vacationMessage = body.get("vacationMessage") != null ? body.get("vacationMessage").toString() : null;
        VendorResponseDto updated = vendorService.toggleVacationMode(email, vacationMode, vacationMessage);
        return ResponseEntity.ok(ApiResponse.success(updated, "Store vacation mode updated successfully"));
    }

    @GetMapping("/me/pickup-addresses")
    @Operation(summary = "List vendor pickup addresses", description = "Retrieves all registered warehouse/pickup locations for this vendor")
    public ResponseEntity<ApiResponse<List<VendorPickupAddressDto>>> getPickupAddresses(Principal principal) {
        String email = getAuthenticatedEmail(principal);
        List<VendorPickupAddressDto> addresses = vendorService.getPickupAddresses(email);
        return ResponseEntity.ok(ApiResponse.success(addresses));
    }

    @PostMapping("/me/pickup-addresses")
    @Operation(summary = "Add vendor pickup address", description = "Registers a new warehouse or fulfillment pickup location")
    public ResponseEntity<ApiResponse<VendorPickupAddressDto>> addPickupAddress(
            Principal principal,
            @Valid @RequestBody CreatePickupAddressRequest request
    ) {
        String email = getAuthenticatedEmail(principal);
        VendorPickupAddressDto address = vendorService.addPickupAddress(email, request);
        return new ResponseEntity<>(ApiResponse.success(address, "Pickup address added successfully"), HttpStatus.CREATED);
    }

    @PutMapping("/me/pickup-addresses/{id}/primary")
    @Operation(summary = "Set primary pickup address", description = "Sets the default warehouse pickup address for order fulfillment")
    public ResponseEntity<ApiResponse<VendorPickupAddressDto>> setPrimaryPickupAddress(
            Principal principal,
            @PathVariable UUID id
    ) {
        String email = getAuthenticatedEmail(principal);
        VendorPickupAddressDto address = vendorService.setPrimaryPickupAddress(email, id);
        return ResponseEntity.ok(ApiResponse.success(address, "Primary pickup address updated"));
    }

    @DeleteMapping("/me/pickup-addresses/{id}")
    @Operation(summary = "Delete pickup address", description = "Deletes a vendor pickup address")
    public ResponseEntity<ApiResponse<Void>> deletePickupAddress(
            Principal principal,
            @PathVariable UUID id
    ) {
        String email = getAuthenticatedEmail(principal);
        vendorService.deletePickupAddress(email, id);
        return ResponseEntity.ok(ApiResponse.success("Pickup address deleted successfully"));
    }

    @GetMapping("/stores/{slug}")
    @Operation(summary = "Get public vendor storefront", description = "Returns public seller store details by store slug for customers")
    public ResponseEntity<ApiResponse<PublicVendorStoreDto>> getPublicStore(@PathVariable String slug) {
        PublicVendorStoreDto store = vendorService.getPublicStoreBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(store));
    }
}
