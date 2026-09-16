package com.alight.marketplace.modules.review.dto;

import com.alight.marketplace.modules.review.entity.ProductQuestion;
import com.alight.marketplace.modules.review.entity.QuestionStatus;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionResponse {

    private UUID id;
    private UUID productId;
    private String productTitle;
    private String productSlug;
    private UUID vendorId;
    private String vendorStoreName;
    private UUID userId;
    private String customerName;
    private String questionText;
    private QuestionStatus status;
    private int upvotes;
    private boolean userUpvoted;
    private List<AnswerResponse> answers;
    private Instant createdAt;
    private Instant updatedAt;

    public static QuestionResponse fromEntity(ProductQuestion question) {
        return fromEntity(question, false);
    }

    public static QuestionResponse fromEntity(ProductQuestion question, boolean userUpvoted) {
        String customerName = "Anonymous Customer";
        if (question.getUser() != null) {
            customerName = question.getUser().getFirstName() + " " + (question.getUser().getLastName() != null ? question.getUser().getLastName() : "");
            customerName = customerName.trim();
        }

        List<AnswerResponse> answerResponses = new ArrayList<>();
        if (question.getAnswers() != null) {
            answerResponses = question.getAnswers().stream()
                    .filter(a -> a.getStatus() == QuestionStatus.APPROVED)
                    .map(AnswerResponse::fromEntity)
                    .collect(Collectors.toList());
        }

        return QuestionResponse.builder()
                .id(question.getId())
                .productId(question.getProduct() != null ? question.getProduct().getId() : null)
                .productTitle(question.getProduct() != null ? question.getProduct().getTitle() : null)
                .productSlug(question.getProduct() != null ? question.getProduct().getSlug() : null)
                .vendorId(question.getVendor() != null ? question.getVendor().getId() : null)
                .vendorStoreName(question.getVendor() != null ? question.getVendor().getStoreName() : null)
                .userId(question.getUser() != null ? question.getUser().getId() : null)
                .customerName(customerName)
                .questionText(question.getQuestionText())
                .status(question.getStatus())
                .upvotes(question.getUpvotes())
                .userUpvoted(userUpvoted)
                .answers(answerResponses)
                .createdAt(question.getCreatedAt())
                .updatedAt(question.getUpdatedAt())
                .build();
    }
}
