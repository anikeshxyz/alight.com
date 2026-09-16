package com.alight.marketplace.modules.vendor.dto;

import com.alight.marketplace.modules.vendor.entity.BusinessType;
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
public class VendorBusinessDetailsDto {
    private UUID id;
    private String legalBusinessName;
    private BusinessType businessType;
    private String taxIdGstin;
    private String panNumber;
    private String bankAccountNumber;
    private String bankIfscCode;
    private String bankName;
    private String bankAccountHolderName;
    private String businessLicenseUrl;
    private String taxCertificateUrl;
    private String idProofUrl;
    private boolean verified;
    private Instant createdAt;
    private Instant updatedAt;
}
