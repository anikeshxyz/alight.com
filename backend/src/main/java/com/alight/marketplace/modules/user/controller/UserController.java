package com.alight.marketplace.modules.user.controller;

import com.alight.marketplace.common.exception.UnauthorizedException;
import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.user.dto.AddressDto;
import com.alight.marketplace.modules.user.dto.CreateAddressRequest;
import com.alight.marketplace.modules.user.dto.UpdateProfileRequest;
import com.alight.marketplace.modules.user.dto.UserProfileDto;
import com.alight.marketplace.modules.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "Endpoints for managing user accounts, profiles, and shipping addresses")
public class UserController {

    private final UserService userService;

    private String getAuthenticatedEmail(Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new UnauthorizedException("Authentication required to access user resources");
        }
        return principal.getName();
    }

    @GetMapping("/profile")
    @Operation(summary = "Get user profile", description = "Returns details of the currently authenticated user")
    public ResponseEntity<ApiResponse<UserProfileDto>> getProfile(Principal principal) {
        String email = getAuthenticatedEmail(principal);
        UserProfileDto profile = userService.getCurrentUserProfile(email);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update user profile", description = "Updates profile details for the authenticated user")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateProfile(
            Principal principal,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        String email = getAuthenticatedEmail(principal);
        UserProfileDto updated = userService.updateUserProfile(email, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Profile updated successfully"));
    }

    @GetMapping("/addresses")
    @Operation(summary = "Get saved shipping addresses", description = "Lists all shipping addresses belonging to the authenticated user")
    public ResponseEntity<ApiResponse<List<AddressDto>>> getAddresses(Principal principal) {
        String email = getAuthenticatedEmail(principal);
        List<AddressDto> addresses = userService.getUserAddresses(email);
        return ResponseEntity.ok(ApiResponse.success(addresses));
    }

    @PostMapping("/addresses")
    @Operation(summary = "Add a new shipping address", description = "Creates a new shipping address for the authenticated user")
    public ResponseEntity<ApiResponse<AddressDto>> addAddress(
            Principal principal,
            @Valid @RequestBody CreateAddressRequest request
    ) {
        String email = getAuthenticatedEmail(principal);
        AddressDto address = userService.createAddress(email, request);
        return new ResponseEntity<>(ApiResponse.success(address, "Address added successfully"), HttpStatus.CREATED);
    }

    @PutMapping("/addresses/{id}/default")
    @Operation(summary = "Set default shipping address", description = "Sets the designated address as primary default")
    public ResponseEntity<ApiResponse<AddressDto>> setDefaultAddress(
            Principal principal,
            @PathVariable UUID id
    ) {
        String email = getAuthenticatedEmail(principal);
        AddressDto address = userService.setDefaultAddress(email, id);
        return ResponseEntity.ok(ApiResponse.success(address, "Default address updated"));
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get customer dashboard overview", description = "Returns aggregated dashboard metrics, recent orders, and returns for the authenticated customer")
    public ResponseEntity<ApiResponse<com.alight.marketplace.modules.user.dto.CustomerDashboardDto>> getDashboard(Principal principal) {
        String email = getAuthenticatedEmail(principal);
        com.alight.marketplace.modules.user.dto.CustomerDashboardDto dashboard = userService.getCustomerDashboard(email);
        return ResponseEntity.ok(ApiResponse.success(dashboard));
    }

    @PutMapping("/addresses/{id}")
    @Operation(summary = "Update shipping address", description = "Updates an existing shipping address by ID")
    public ResponseEntity<ApiResponse<AddressDto>> updateAddress(
            Principal principal,
            @PathVariable UUID id,
            @Valid @RequestBody CreateAddressRequest request
    ) {
        String email = getAuthenticatedEmail(principal);
        AddressDto address = userService.updateAddress(email, id, request);
        return ResponseEntity.ok(ApiResponse.success(address, "Address updated successfully"));
    }

    @DeleteMapping("/addresses/{id}")
    @Operation(summary = "Delete shipping address", description = "Deletes a shipping address by ID")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            Principal principal,
            @PathVariable UUID id
    ) {
        String email = getAuthenticatedEmail(principal);
        userService.deleteAddress(email, id);
        return ResponseEntity.ok(ApiResponse.success("Address deleted successfully"));
    }
}
