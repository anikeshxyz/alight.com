package com.alight.marketplace.modules.review.controller;

import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.common.exception.UnauthorizedException;
import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.review.dto.CreateQuestionRequest;
import com.alight.marketplace.modules.review.dto.CreateReviewRequest;
import com.alight.marketplace.modules.review.dto.QuestionResponse;
import com.alight.marketplace.modules.review.dto.ReviewResponse;
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

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
@Tag(name = "Customer Reviews & Questions", description = "Customer endpoints for submitting product reviews and questions")
public class CustomerReviewController {

    private final ReviewService reviewService;
    private final ProductQaService productQaService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Submit or update a product review")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateReviewRequest request
    ) {
        UUID userId = getUserId(userDetails);
        ReviewResponse response = reviewService.createReview(userId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Review submitted successfully"));
    }

    @GetMapping("/my-reviews")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "List all reviews submitted by the logged-in customer")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getMyReviews(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        UUID userId = getUserId(userDetails);
        Page<ReviewResponse> response = reviewService.getCustomerReviews(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Customer reviews retrieved successfully"));
    }

    @GetMapping("/eligibility")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Check if customer is a verified purchaser for a product")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkEligibility(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam UUID productId
    ) {
        UUID userId = getUserId(userDetails);
        boolean isVerified = reviewService.checkVerifiedPurchaseEligibility(userId, productId);
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("productId", productId, "isVerifiedPurchaser", isVerified),
                "Purchase verification checked"
        ));
    }

    @PostMapping("/questions")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Ask a question on a product")
    public ResponseEntity<ApiResponse<QuestionResponse>> askQuestion(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateQuestionRequest request
    ) {
        UUID userId = getUserId(userDetails);
        QuestionResponse response = productQaService.askQuestion(userId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Question posted successfully"));
    }

    private UUID getUserId(UserDetails userDetails) {
        if (userDetails == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userDetails.getUsername()));
    }
}
