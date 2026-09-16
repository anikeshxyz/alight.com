package com.alight.marketplace.modules.order.dto;

import com.alight.marketplace.modules.order.entity.FulfillmentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateFulfillmentRequest {
    @NotNull(message = "Fulfillment status is required")
    private FulfillmentStatus fulfillmentStatus;

    private String courierPartner;

    private String trackingNumber;

    private String notes;
}
