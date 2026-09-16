package com.alight.marketplace.modules.review.dto;

import com.alight.marketplace.modules.review.entity.AuthorType;
import com.alight.marketplace.modules.review.entity.ProductAnswer;
import com.alight.marketplace.modules.review.entity.QuestionStatus;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnswerResponse {

    private UUID id;
    private UUID questionId;
    private UUID userId;
    private AuthorType authorType;
    private String authorName;
    private String answerText;
    private boolean verifiedSeller;
    private boolean accepted;
    private QuestionStatus status;
    private int upvotes;
    private Instant createdAt;
    private Instant updatedAt;

    public static AnswerResponse fromEntity(ProductAnswer answer) {
        return AnswerResponse.builder()
                .id(answer.getId())
                .questionId(answer.getQuestion() != null ? answer.getQuestion().getId() : null)
                .userId(answer.getUser() != null ? answer.getUser().getId() : null)
                .authorType(answer.getAuthorType())
                .authorName(answer.getAuthorName())
                .answerText(answer.getAnswerText())
                .verifiedSeller(answer.isVerifiedSeller())
                .accepted(answer.isAccepted())
                .status(answer.getStatus())
                .upvotes(answer.getUpvotes())
                .createdAt(answer.getCreatedAt())
                .updatedAt(answer.getUpdatedAt())
                .build();
    }
}
