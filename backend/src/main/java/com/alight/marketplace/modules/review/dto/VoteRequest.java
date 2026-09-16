package com.alight.marketplace.modules.review.dto;

import com.alight.marketplace.modules.review.entity.VoteType;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoteRequest {

    @NotNull(message = "Vote type is required")
    private VoteType voteType;
}
