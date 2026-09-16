package com.alight.marketplace.modules.returns.dto;

import com.alight.marketplace.modules.returns.entity.ItemCondition;
import com.alight.marketplace.modules.returns.entity.RestockAction;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RmaInspectionItemDto {

    @NotNull(message = "RMA Item ID is required")
    private UUID rmaItemId;

    @NotNull(message = "Item condition is required")
    private ItemCondition condition;

    @NotNull(message = "Restock action is required")
    private RestockAction restockAction;

    private UUID warehouseId;

    private String notes;
}
