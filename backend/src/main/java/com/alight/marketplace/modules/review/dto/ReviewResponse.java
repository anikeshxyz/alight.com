package com.alight.marketplace.modules.review.dto;

import com.alight.marketplace.modules.review.entity.Review;
import com.alight.marketplace.modules.review.entity.ReviewStatus;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponse {

    private UUID id;
    private UUID productId;
    private String productTitle;
    private String productSlug;
    private UUID vendorId;
    private String vendorStoreName;
    private UUID userId;
    private String customerName;
    private int rating;
    private String title;
    private String comment;
    private boolean verifiedPurchase;
    private List<String> images;
    private ReviewStatus status;
    private int helpfulCount;
    private int unhelpfulCount;
    private String userVote; // HELPFUL, UNHELPFUL, or null
    private String vendorResponse;
    private Instant vendorRespondedAt;
    private Instant createdAt;
    private Instant updatedAt;

    public static ReviewResponse fromEntity(Review review) {
        return fromEntity(review, null);
    }

    public static ReviewResponse fromEntity(Review review, String userVote) {
        String customerName = "Anonymous Customer";
        if (review.getUser() != null) {
            customerName = review.getUser().getFirstName() + " " + (review.getUser().getLastName() != null ? review.getUser().getLastName() : "");
            customerName = customerName.trim();
        }

        return ReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProduct() != null ? review.getProduct().getId() : null)
                .productTitle(review.getProduct() != null ? review.getProduct().getTitle() : null)
                .productSlug(review.getProduct() != null ? review.getProduct().getSlug() : null)
                .vendorId(review.getVendor() != null ? review.getVendor().getId() : null)
                .vendorStoreName(review.getVendor() != null ? review.getVendor().getStoreName() : null)
                .userId(review.getUser() != null ? review.getUser().getId() : null)
                .customerName(customerName)
                .rating(review.getRating())
                .title(review.getTitle())
                .comment(review.getComment())
                .verifiedPurchase(review.isVerifiedPurchase())
                .images(review.getImages())
                .status(review.getStatus())
                .helpfulCount(review.getHelpfulCount())
                .unhelpfulCount(review.getUnhelpfulCount())
                .userVote(userVote)
                .vendorResponse(review.getVendorResponse())
                .vendorRespondedAt(review.getVendorRespondedAt())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}
