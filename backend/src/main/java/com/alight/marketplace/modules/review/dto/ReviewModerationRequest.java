package com.alight.marketplace.modules.review.dto;

import com.alight.marketplace.modules.review.entity.ReviewStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewModerationRequest {

    @NotNull(message = "Review status is required")
    private ReviewStatus status;

    private String moderationNotes;
}
