package com.alight.marketplace.modules.returns.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RmaInspectionRequestDto {

    @NotNull(message = "Pass/Fail decision is required")
    private Boolean inspectionPassed;

    private String inspectionNotes;

    private BigDecimal customRefundAmount;

    private BigDecimal restockFee;

    @NotEmpty(message = "Items inspection details must be provided")
    private List<RmaInspectionItemDto> items;
}
