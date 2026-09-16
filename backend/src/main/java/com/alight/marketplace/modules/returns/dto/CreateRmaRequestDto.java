package com.alight.marketplace.modules.returns.dto;

import com.alight.marketplace.modules.returns.entity.ReturnReason;
import com.alight.marketplace.modules.returns.entity.ReturnType;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateRmaRequestDto {

    @NotNull(message = "Order ID is required")
    private UUID orderId;

    @NotNull(message = "Vendor Order ID is required")
    private UUID vendorOrderId;

    @NotNull(message = "Return type is required")
    private ReturnType returnType;

    @NotNull(message = "Return reason is required")
    private ReturnReason reason;

    private String customerComments;

    private String proofImages;

    @NotEmpty(message = "At least one item must be returned")
    private List<RmaItemInputDto> items;
}
