package com.alight.marketplace.modules.review.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateQuestionRequest {

    @NotNull(message = "Product ID is required")
    private UUID productId;

    @NotBlank(message = "Question text cannot be empty")
    private String questionText;
}
