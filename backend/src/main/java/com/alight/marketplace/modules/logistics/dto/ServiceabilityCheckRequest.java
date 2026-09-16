package com.alight.marketplace.modules.logistics.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceabilityCheckRequest {

    @NotBlank(message = "Destination pincode is required")
    private String destinationPincode;

    private String originPincode;
}
