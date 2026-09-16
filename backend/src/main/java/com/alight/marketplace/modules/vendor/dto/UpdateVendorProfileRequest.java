package com.alight.marketplace.modules.vendor.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateVendorProfileRequest {

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
}
