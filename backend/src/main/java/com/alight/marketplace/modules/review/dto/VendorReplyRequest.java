package com.alight.marketplace.modules.review.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorReplyRequest {

    @NotBlank(message = "Vendor response cannot be empty")
    private String responseText;
}
