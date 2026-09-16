package com.alight.marketplace.modules.logistics.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddTrackingEventRequest {

    @NotBlank(message = "Event status is required")
    private String eventStatus; // e.g. PICKED_UP, REACHED_HUB, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, RTO_INITIATED

    @NotBlank(message = "Location hub is required")
    private String locationHub;

    @NotBlank(message = "City is required")
    private String city;

    private String state;
    private String remarks;
    private String scannedBy;
    private BigDecimal latitude;
    private BigDecimal longitude;
}
