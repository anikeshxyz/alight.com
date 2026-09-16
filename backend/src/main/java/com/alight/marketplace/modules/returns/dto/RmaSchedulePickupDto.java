package com.alight.marketplace.modules.returns.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RmaSchedulePickupDto {

    @NotBlank(message = "Carrier code is required")
    private String carrierCode;

    private String pickupAddress;

    private Instant scheduledDate;

    private String notes;
}
