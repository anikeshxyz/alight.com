package com.alight.marketplace.modules.returns.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RmaPolicyDto {
    private UUID id;
    private UUID categoryId;
    private String categoryName;
    private UUID vendorId;
    private String vendorName;

    @NotBlank(message = "Policy name is required")
    private String policyName;

    @Min(value = 0, message = "Return window must be non-negative")
    private Integer returnWindowDays;

    private Boolean isReturnable;
    private BigDecimal restockingFeePercentage;
    private Boolean requiresApproval;
    private Boolean allowRefund;
    private Boolean allowReplacement;
    private Boolean allowStoreCredit;
    private String termsConditions;
    private Instant createdAt;
    private Instant updatedAt;
}
