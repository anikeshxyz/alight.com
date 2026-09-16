package com.alight.marketplace.modules.settlement.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayoutRequestDto {

    @NotNull(message = "Payout amount is required")
    @DecimalMin(value = "500.00", message = "Minimum payout amount is 500.00")
    private BigDecimal amount;

    private String notes;
}
