package com.alight.marketplace.modules.returns.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RmaReviewRequestDto {

    @NotNull(message = "Decision is required (true to approve, false to reject)")
    private Boolean approved;

    private String reviewNotes;
}
