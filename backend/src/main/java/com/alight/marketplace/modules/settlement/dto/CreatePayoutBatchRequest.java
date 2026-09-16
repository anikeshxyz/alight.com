package com.alight.marketplace.modules.settlement.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePayoutBatchRequest {

    @NotEmpty(message = "At least one payout ID is required to form a batch")
    private List<UUID> payoutIds;

    private String notes;
}
