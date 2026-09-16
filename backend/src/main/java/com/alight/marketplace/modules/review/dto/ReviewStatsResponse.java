package com.alight.marketplace.modules.review.dto;

import lombok.*;

import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewStatsResponse {

    private UUID productId;
    private double averageRating;
    private long totalReviews;
    private Map<Integer, Long> ratingBreakdown; // 5 -> count, 4 -> count, 3 -> count, 2 -> count, 1 -> count
    private Map<Integer, Double> ratingPercentages; // 5 -> 70.5%, etc.
    private long verifiedPurchasesCount;
    private long withPhotosCount;
}
