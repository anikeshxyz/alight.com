package com.alight.marketplace.modules.vendor.dto;

import com.alight.marketplace.modules.vendor.entity.BusinessType;
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
public class UpdateBusinessDetailsRequest {

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
}
