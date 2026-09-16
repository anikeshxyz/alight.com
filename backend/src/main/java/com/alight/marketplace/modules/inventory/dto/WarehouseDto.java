package com.alight.marketplace.modules.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseDto {
    private UUID id;
    private UUID vendorId;
    private String vendorStoreName;
    private String name;
    private String code;
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
    private boolean active;
    private boolean primary;
    private Instant createdAt;
    private Instant updatedAt;
}
