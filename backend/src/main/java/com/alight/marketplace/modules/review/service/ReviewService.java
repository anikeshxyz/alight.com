package com.alight.marketplace.modules.review.service;

import com.alight.marketplace.modules.review.dto.*;
import com.alight.marketplace.modules.review.entity.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ReviewService {

    ReviewResponse createReview(UUID userId, CreateReviewRequest request);

    ReviewResponse getReviewById(UUID reviewId, UUID currentUserId);

    Page<ReviewResponse> getProductReviews(UUID productId, UUID currentUserId, Pageable pageable);

    ReviewStatsResponse getProductReviewStats(UUID productId);

    Page<ReviewResponse> getCustomerReviews(UUID userId, Pageable pageable);

    Page<ReviewResponse> getVendorReviews(UUID vendorUserId, ReviewStatus status, Pageable pageable);

    ReviewResponse replyToReview(UUID vendorUserId, UUID reviewId, VendorReplyRequest request);

    ReviewResponse moderateReview(UUID reviewId, ReviewModerationRequest request);

    Page<ReviewResponse> getReviewsForModeration(ReviewStatus status, Pageable pageable);

    ReviewResponse voteReview(UUID userId, UUID reviewId, VoteRequest request);

    boolean checkVerifiedPurchaseEligibility(UUID userId, UUID productId);
}
