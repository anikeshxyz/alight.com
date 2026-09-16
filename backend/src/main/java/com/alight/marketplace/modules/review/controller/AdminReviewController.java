package com.alight.marketplace.modules.review.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.review.dto.QuestionResponse;
import com.alight.marketplace.modules.review.dto.ReviewModerationRequest;
import com.alight.marketplace.modules.review.dto.ReviewResponse;
import com.alight.marketplace.modules.review.entity.QuestionStatus;
import com.alight.marketplace.modules.review.entity.ReviewStatus;
import com.alight.marketplace.modules.review.service.ProductQaService;
import com.alight.marketplace.modules.review.service.ReviewService;
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
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin Reviews & Q&A Moderation Desk", description = "Admin workspace for content moderation and spam filtering")
public class AdminReviewController {

    private final ReviewService reviewService;
    private final ProductQaService productQaService;

    @GetMapping("/reviews")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all marketplace reviews with optional moderation status filtering")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getReviews(
            @RequestParam(required = false) ReviewStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<ReviewResponse> response = reviewService.getReviewsForModeration(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Reviews retrieved for moderation"));
    }

    @PostMapping("/reviews/{reviewId}/moderate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Moderate review (Approve, Reject, or Flag as Spam)")
    public ResponseEntity<ApiResponse<ReviewResponse>> moderateReview(
            @PathVariable UUID reviewId,
            @Valid @RequestBody ReviewModerationRequest request
    ) {
        ReviewResponse response = reviewService.moderateReview(reviewId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Review moderation status updated"));
    }

    @GetMapping("/questions")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all marketplace questions with optional moderation status filtering")
    public ResponseEntity<ApiResponse<Page<QuestionResponse>>> getQuestions(
            @RequestParam(required = false) QuestionStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<QuestionResponse> response = productQaService.getQuestionsForModeration(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Questions retrieved for moderation"));
    }

    @PostMapping("/questions/{questionId}/moderate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Moderate product question (Approve or Reject)")
    public ResponseEntity<ApiResponse<QuestionResponse>> moderateQuestion(
            @PathVariable UUID questionId,
            @RequestParam QuestionStatus status
    ) {
        QuestionResponse response = productQaService.moderateQuestion(questionId, status);
        return ResponseEntity.ok(ApiResponse.success(response, "Question moderation status updated"));
    }
}
