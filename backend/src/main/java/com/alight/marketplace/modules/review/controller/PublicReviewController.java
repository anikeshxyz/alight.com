package com.alight.marketplace.modules.review.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.review.dto.*;
import com.alight.marketplace.modules.review.service.ProductQaService;
import com.alight.marketplace.modules.review.service.ReviewService;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Tag(name = "Public Product Reviews & Q&A", description = "Endpoints for viewing ratings, customer reviews, and product Q&A threads")
public class PublicReviewController {

    private final ReviewService reviewService;
    private final ProductQaService productQaService;
    private final UserRepository userRepository;

    @GetMapping("/{productId}/reviews")
    @Operation(summary = "Get paginated approved reviews for a product with optional vote states")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getProductReviews(
            @PathVariable UUID productId,
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        UUID currentUserId = getUserIdFromUserDetails(userDetails);
        Page<ReviewResponse> reviews = reviewService.getProductReviews(productId, currentUserId, pageable);
        return ResponseEntity.ok(ApiResponse.success(reviews, "Product reviews retrieved successfully"));
    }

    @GetMapping("/{productId}/reviews/stats")
    @Operation(summary = "Get rating distribution stats, average score, and verified counts for a product")
    public ResponseEntity<ApiResponse<ReviewStatsResponse>> getProductReviewStats(@PathVariable UUID productId) {
        ReviewStatsResponse stats = reviewService.getProductReviewStats(productId);
        return ResponseEntity.ok(ApiResponse.success(stats, "Review statistics retrieved successfully"));
    }

    @PostMapping("/reviews/{reviewId}/vote")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Vote a review as helpful or unhelpful")
    public ResponseEntity<ApiResponse<ReviewResponse>> voteReview(
            @PathVariable UUID reviewId,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody VoteRequest request
    ) {
        UUID userId = getRequiredUserId(userDetails);
        ReviewResponse response = reviewService.voteReview(userId, reviewId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Vote registered successfully"));
    }

    @GetMapping("/{productId}/questions")
    @Operation(summary = "Get paginated community Q&A threads for a product")
    public ResponseEntity<ApiResponse<Page<QuestionResponse>>> getProductQuestions(
            @PathVariable UUID productId,
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 10, sort = "upvotes", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        UUID currentUserId = getUserIdFromUserDetails(userDetails);
        Page<QuestionResponse> questions = productQaService.getProductQuestions(productId, currentUserId, pageable);
        return ResponseEntity.ok(ApiResponse.success(questions, "Product questions retrieved successfully"));
    }

    @PostMapping("/questions/{questionId}/upvote")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Upvote or remove upvote from a question")
    public ResponseEntity<ApiResponse<QuestionResponse>> upvoteQuestion(
            @PathVariable UUID questionId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getRequiredUserId(userDetails);
        QuestionResponse response = productQaService.upvoteQuestion(userId, questionId);
        return ResponseEntity.ok(ApiResponse.success(response, "Question upvote toggled successfully"));
    }

    @PostMapping("/questions/{questionId}/answers")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Submit an answer to a product question")
    public ResponseEntity<ApiResponse<AnswerResponse>> answerQuestion(
            @PathVariable UUID questionId,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateAnswerRequest request
    ) {
        UUID userId = getRequiredUserId(userDetails);
        AnswerResponse response = productQaService.answerQuestion(userId, questionId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Answer submitted successfully"));
    }

    private UUID getUserIdFromUserDetails(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElse(null);
    }

    private UUID getRequiredUserId(UserDetails userDetails) {
        if (userDetails == null) {
            throw new com.alight.marketplace.common.exception.UnauthorizedException("User is not authenticated");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElseThrow(() -> new com.alight.marketplace.common.exception.ResourceNotFoundException("User not found: " + userDetails.getUsername()));
    }
}
