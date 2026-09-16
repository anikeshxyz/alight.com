package com.alight.marketplace.modules.review.controller;

import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.common.exception.UnauthorizedException;
import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.review.dto.*;
import com.alight.marketplace.modules.review.entity.QuestionStatus;
import com.alight.marketplace.modules.review.entity.ReviewStatus;
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
@RequestMapping("/api/v1/vendor")
@RequiredArgsConstructor
@Tag(name = "Vendor Reviews & Questions Desk", description = "Vendor workspace for managing customer feedback and answering product inquiries")
public class VendorReviewController {

    private final ReviewService reviewService;
    private final ProductQaService productQaService;
    private final UserRepository userRepository;

    @GetMapping("/reviews")
    @PreAuthorize("hasRole('VENDOR')")
    @Operation(summary = "Get reviews on products belonging to the logged-in vendor")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getVendorReviews(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) ReviewStatus status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        UUID userId = getUserId(userDetails);
        Page<ReviewResponse> response = reviewService.getVendorReviews(userId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Vendor reviews retrieved successfully"));
    }

    @PostMapping("/reviews/{reviewId}/reply")
    @PreAuthorize("hasRole('VENDOR')")
    @Operation(summary = "Post an official vendor response to a customer review")
    public ResponseEntity<ApiResponse<ReviewResponse>> replyToReview(
            @PathVariable UUID reviewId,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody VendorReplyRequest request
    ) {
        UUID userId = getUserId(userDetails);
        ReviewResponse response = reviewService.replyToReview(userId, reviewId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Vendor reply posted successfully"));
    }

    @GetMapping("/questions")
    @PreAuthorize("hasRole('VENDOR')")
    @Operation(summary = "Get customer questions asked on vendor products")
    public ResponseEntity<ApiResponse<Page<QuestionResponse>>> getVendorQuestions(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) QuestionStatus status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        UUID userId = getUserId(userDetails);
        Page<QuestionResponse> response = productQaService.getVendorQuestions(userId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Vendor questions retrieved successfully"));
    }

    @PostMapping("/questions/{questionId}/answer")
    @PreAuthorize("hasRole('VENDOR')")
    @Operation(summary = "Post an official vendor answer to a customer question")
    public ResponseEntity<ApiResponse<AnswerResponse>> answerQuestion(
            @PathVariable UUID questionId,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateAnswerRequest request
    ) {
        UUID userId = getUserId(userDetails);
        AnswerResponse response = productQaService.answerQuestion(userId, questionId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Vendor answer posted successfully"));
    }

    @PostMapping("/answers/{answerId}/accept")
    @PreAuthorize("hasRole('VENDOR')")
    @Operation(summary = "Mark an answer as the accepted official answer")
    public ResponseEntity<ApiResponse<AnswerResponse>> acceptAnswer(
            @PathVariable UUID answerId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        AnswerResponse response = productQaService.acceptAnswer(userId, answerId);
        return ResponseEntity.ok(ApiResponse.success(response, "Answer accepted successfully"));
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
