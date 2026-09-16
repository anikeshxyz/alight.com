package com.alight.marketplace.modules.vendor.dto;

import com.alight.marketplace.modules.vendor.entity.VendorStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateVendorStatusRequest {

    @NotNull(message = "Vendor status is required")
    private VendorStatus status;

    private String rejectionReason;
}
