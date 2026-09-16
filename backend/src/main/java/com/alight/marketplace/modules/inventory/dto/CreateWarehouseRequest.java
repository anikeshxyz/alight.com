package com.alight.marketplace.modules.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWarehouseRequest {

    @NotBlank(message = "Warehouse name is required")
    @Size(max = 150)
    private String name;

    @NotBlank(message = "Warehouse code is required")
    @Size(max = 50)
    private String code;

    private String contactName;
    private String contactPhone;
    private String contactEmail;

    @NotBlank(message = "Address line 1 is required")
    private String addressLine1;

    private String addressLine2;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "State is required")
    private String state;

    @NotBlank(message = "Postal code is required")
    private String postalCode;

    @Builder.Default
    private String countryCode = "IN";

    private BigDecimal latitude;
    private BigDecimal longitude;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private boolean primary = false;
}
