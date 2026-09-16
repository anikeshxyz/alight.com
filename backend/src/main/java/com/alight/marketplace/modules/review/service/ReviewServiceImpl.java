package com.alight.marketplace.modules.review.service;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.order.repository.OrderItemRepository;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.review.dto.*;
import com.alight.marketplace.modules.review.entity.Review;
import com.alight.marketplace.modules.review.entity.ReviewStatus;
import com.alight.marketplace.modules.review.entity.ReviewVote;
import com.alight.marketplace.modules.review.entity.VoteType;
import com.alight.marketplace.modules.review.repository.ReviewRepository;
import com.alight.marketplace.modules.review.repository.ReviewVoteRepository;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewVoteRepository reviewVoteRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final OrderItemRepository orderItemRepository;

    @Override
    @Transactional
    public ReviewResponse createReview(UUID userId, CreateReviewRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        boolean isVerified = orderItemRepository.hasUserPurchasedProduct(product.getId(), userId);

        Optional<Review> existingOpt = reviewRepository.findByProductIdAndUserId(product.getId(), userId);
        Review review;
        if (existingOpt.isPresent()) {
            review = existingOpt.get();
            review.setRating(request.getRating());
            review.setTitle(request.getTitle());
            review.setComment(request.getComment());
            review.setImages(request.getImages() != null ? request.getImages() : new ArrayList<>());
            review.setVerifiedPurchase(isVerified);
            review.setStatus(ReviewStatus.APPROVED);
        } else {
            review = Review.builder()
                    .product(product)
                    .user(user)
                    .vendor(product.getVendor())
                    .rating(request.getRating())
                    .title(request.getTitle())
                    .comment(request.getComment())
                    .verifiedPurchase(isVerified)
                    .images(request.getImages() != null ? request.getImages() : new ArrayList<>())
                    .status(ReviewStatus.APPROVED)
                    .build();
        }

        review = reviewRepository.save(review);

        // Recalculate and update cached rating on product
        updateProductRatingCache(product.getId());

        return ReviewResponse.fromEntity(review);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewResponse getReviewById(UUID reviewId, UUID currentUserId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        String userVote = null;
        if (currentUserId != null) {
            Optional<ReviewVote> voteOpt = reviewVoteRepository.findByReviewIdAndUserId(reviewId, currentUserId);
            if (voteOpt.isPresent()) {
                userVote = voteOpt.get().getVoteType().name();
            }
        }

        return ReviewResponse.fromEntity(review, userVote);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getProductReviews(UUID productId, UUID currentUserId, Pageable pageable) {
        Page<Review> reviewsPage = reviewRepository.findByProductIdAndStatus(productId, ReviewStatus.APPROVED, pageable);

        return reviewsPage.map(review -> {
            String userVote = null;
            if (currentUserId != null) {
                Optional<ReviewVote> voteOpt = reviewVoteRepository.findByReviewIdAndUserId(review.getId(), currentUserId);
                if (voteOpt.isPresent()) {
                    userVote = voteOpt.get().getVoteType().name();
                }
            }
            return ReviewResponse.fromEntity(review, userVote);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewStatsResponse getProductReviewStats(UUID productId) {
        List<Review> approvedReviews = reviewRepository.findByProductIdAndStatus(productId, ReviewStatus.APPROVED);

        long totalCount = approvedReviews.size();
        double averageRating = 0.0;
        long verifiedPurchasesCount = 0;
        long withPhotosCount = 0;

        Map<Integer, Long> breakdown = new LinkedHashMap<>();
        for (int i = 5; i >= 1; i--) {
            breakdown.put(i, 0L);
        }

        if (totalCount > 0) {
            double sum = 0.0;
            for (Review r : approvedReviews) {
                sum += r.getRating();
                breakdown.put(r.getRating(), breakdown.getOrDefault(r.getRating(), 0L) + 1);
                if (r.isVerifiedPurchase()) {
                    verifiedPurchasesCount++;
                }
                if (r.getImages() != null && !r.getImages().isEmpty()) {
                    withPhotosCount++;
                }
            }
            averageRating = BigDecimal.valueOf(sum / totalCount)
                    .setScale(2, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        Map<Integer, Double> ratingPercentages = new LinkedHashMap<>();
        for (int i = 5; i >= 1; i--) {
            long count = breakdown.get(i);
            double pct = totalCount > 0 ? (count * 100.0) / totalCount : 0.0;
            ratingPercentages.put(i, BigDecimal.valueOf(pct).setScale(1, RoundingMode.HALF_UP).doubleValue());
        }

        return ReviewStatsResponse.builder()
                .productId(productId)
                .averageRating(averageRating)
                .totalReviews(totalCount)
                .ratingBreakdown(breakdown)
                .ratingPercentages(ratingPercentages)
                .verifiedPurchasesCount(verifiedPurchasesCount)
                .withPhotosCount(withPhotosCount)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getCustomerReviews(UUID userId, Pageable pageable) {
        return reviewRepository.findByUserId(userId, pageable)
                .map(ReviewResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getVendorReviews(UUID vendorUserId, ReviewStatus status, Pageable pageable) {
        Vendor vendor = vendorRepository.findByUserId(vendorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor profile not found for user: " + vendorUserId));

        if (status != null) {
            return reviewRepository.findByVendorIdAndStatus(vendor.getId(), status, pageable)
                    .map(ReviewResponse::fromEntity);
        }

        return reviewRepository.findByVendorId(vendor.getId(), pageable)
                .map(ReviewResponse::fromEntity);
    }

    @Override
    @Transactional
    public ReviewResponse replyToReview(UUID vendorUserId, UUID reviewId, VendorReplyRequest request) {
        Vendor vendor = vendorRepository.findByUserId(vendorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor profile not found for user: " + vendorUserId));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        if (!review.getVendor().getId().equals(vendor.getId())) {
            throw new BadRequestException("You can only reply to reviews for your own products");
        }

        review.setVendorResponse(request.getResponseText());
        review.setVendorRespondedAt(Instant.now());
        review = reviewRepository.save(review);

        return ReviewResponse.fromEntity(review);
    }

    @Override
    @Transactional
    public ReviewResponse moderateReview(UUID reviewId, ReviewModerationRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        review.setStatus(request.getStatus());
        review = reviewRepository.save(review);

        updateProductRatingCache(review.getProduct().getId());

        return ReviewResponse.fromEntity(review);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getReviewsForModeration(ReviewStatus status, Pageable pageable) {
        if (status != null) {
            return reviewRepository.findByStatus(status, pageable).map(ReviewResponse::fromEntity);
        }
        return reviewRepository.findAll(pageable).map(ReviewResponse::fromEntity);
    }

    @Override
    @Transactional
    public ReviewResponse voteReview(UUID userId, UUID reviewId, VoteRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found: " + reviewId));

        Optional<ReviewVote> existingVoteOpt = reviewVoteRepository.findByReviewIdAndUserId(reviewId, userId);

        if (existingVoteOpt.isPresent()) {
            ReviewVote existingVote = existingVoteOpt.get();
            if (existingVote.getVoteType() == request.getVoteType()) {
                // Remove vote (toggle off)
                reviewVoteRepository.delete(existingVote);
                if (request.getVoteType() == VoteType.HELPFUL) {
                    review.setHelpfulCount(Math.max(0, review.getHelpfulCount() - 1));
                } else {
                    review.setUnhelpfulCount(Math.max(0, review.getUnhelpfulCount() - 1));
                }
                review = reviewRepository.save(review);
                return ReviewResponse.fromEntity(review, null);
            } else {
                // Switch vote
                if (request.getVoteType() == VoteType.HELPFUL) {
                    review.setHelpfulCount(review.getHelpfulCount() + 1);
                    review.setUnhelpfulCount(Math.max(0, review.getUnhelpfulCount() - 1));
                } else {
                    review.setUnhelpfulCount(review.getUnhelpfulCount() + 1);
                    review.setHelpfulCount(Math.max(0, review.getHelpfulCount() - 1));
                }
                existingVote.setVoteType(request.getVoteType());
                reviewVoteRepository.save(existingVote);
                review = reviewRepository.save(review);
                return ReviewResponse.fromEntity(review, request.getVoteType().name());
            }
        } else {
            // New vote
            ReviewVote newVote = ReviewVote.builder()
                    .review(review)
                    .user(user)
                    .voteType(request.getVoteType())
                    .build();
            reviewVoteRepository.save(newVote);

            if (request.getVoteType() == VoteType.HELPFUL) {
                review.setHelpfulCount(review.getHelpfulCount() + 1);
            } else {
                review.setUnhelpfulCount(review.getUnhelpfulCount() + 1);
            }
            review = reviewRepository.save(review);
            return ReviewResponse.fromEntity(review, request.getVoteType().name());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean checkVerifiedPurchaseEligibility(UUID userId, UUID productId) {
        return orderItemRepository.hasUserPurchasedProduct(productId, userId);
    }

    private void updateProductRatingCache(UUID productId) {
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) return;

        List<Review> approved = reviewRepository.findByProductIdAndStatus(productId, ReviewStatus.APPROVED);
        int count = approved.size();
        BigDecimal avg = BigDecimal.ZERO;
        if (count > 0) {
            double sum = approved.stream().mapToInt(Review::getRating).sum();
            avg = BigDecimal.valueOf(sum / count).setScale(2, RoundingMode.HALF_UP);
        }

        product.setReviewCount(count);
        product.setAverageRating(avg);
        productRepository.save(product);
    }
}
