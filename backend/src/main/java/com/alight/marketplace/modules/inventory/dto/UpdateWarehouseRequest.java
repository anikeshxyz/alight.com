package com.alight.marketplace.modules.inventory.dto;

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
public class UpdateWarehouseRequest {

    @Size(max = 150)
    private String name;

    private String contactName;
    private String contactPhone;
    private String contactEmail;

    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String postalCode;
    private String countryCode;

    private BigDecimal latitude;
    private BigDecimal longitude;

    private Boolean active;
    private Boolean primary;
}
