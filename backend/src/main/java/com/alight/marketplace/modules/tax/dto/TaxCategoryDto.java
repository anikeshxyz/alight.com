package com.alight.marketplace.modules.tax.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxCategoryDto {
    private UUID id;
    private String code;
    private String name;
    private String hsnSacCode;
    private String description;
    private Boolean isActive;
    private Instant createdAt;
}
