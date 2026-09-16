package com.alight.marketplace.modules.vendor.dto;

import com.alight.marketplace.modules.vendor.entity.BusinessType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorApplicationRequest {

    // Store Info
    @NotBlank(message = "Store name is required")
    @Size(min = 2, max = 150, message = "Store name must be between 2 and 150 characters")
    private String storeName;

    private String description;
    private String logoUrl;
    private String bannerUrl;

    @NotBlank(message = "Support email is required")
    @Email(message = "Invalid support email format")
    private String supportEmail;

    @NotBlank(message = "Support phone is required")
    @Size(min = 7, max = 20, message = "Support phone must be between 7 and 20 characters")
    private String supportPhone;

    // Business & KYC Details
    @NotBlank(message = "Legal business name is required")
    @Size(max = 200, message = "Legal business name must not exceed 200 characters")
    private String legalBusinessName;

    @NotNull(message = "Business type is required")
    private BusinessType businessType;

    private String taxIdGstin;
    private String panNumber;

    @NotBlank(message = "Bank account number is required")
    private String bankAccountNumber;

    @NotBlank(message = "Bank IFSC/Routing code is required")
    private String bankIfscCode;

    @NotBlank(message = "Bank name is required")
    private String bankName;

    @NotBlank(message = "Bank account holder name is required")
    private String bankAccountHolderName;

    // Initial Pickup Address
    @NotBlank(message = "Pickup contact person is required")
    private String pickupContactPerson;

    @NotBlank(message = "Pickup contact phone is required")
    private String pickupContactPhone;

    @NotBlank(message = "Pickup address line 1 is required")
    private String pickupAddressLine1;

    private String pickupAddressLine2;

    @NotBlank(message = "Pickup city is required")
    private String pickupCity;

    @NotBlank(message = "Pickup state is required")
    private String pickupState;

    @NotBlank(message = "Pickup postal code is required")
    private String pickupPostalCode;

    @Builder.Default
    private String pickupCountry = "India";
}
