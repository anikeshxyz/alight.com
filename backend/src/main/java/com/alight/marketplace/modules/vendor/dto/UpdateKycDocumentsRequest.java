package com.alight.marketplace.modules.vendor.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateKycDocumentsRequest {

    @Size(max = 512, message = "Business license URL cannot exceed 512 characters")
    private String businessLicenseUrl;

    @Size(max = 512, message = "Tax certificate URL cannot exceed 512 characters")
    private String taxCertificateUrl;

    @Size(max = 512, message = "ID proof URL cannot exceed 512 characters")
    private String idProofUrl;
}
