package com.alight.marketplace.modules.review.service;

import com.alight.marketplace.modules.review.dto.*;
import com.alight.marketplace.modules.review.entity.QuestionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ProductQaService {

    QuestionResponse askQuestion(UUID userId, CreateQuestionRequest request);

    Page<QuestionResponse> getProductQuestions(UUID productId, UUID currentUserId, Pageable pageable);

    AnswerResponse answerQuestion(UUID userId, UUID questionId, CreateAnswerRequest request);

    QuestionResponse upvoteQuestion(UUID userId, UUID questionId);

    AnswerResponse acceptAnswer(UUID vendorUserId, UUID answerId);

    Page<QuestionResponse> getVendorQuestions(UUID vendorUserId, QuestionStatus status, Pageable pageable);

    QuestionResponse moderateQuestion(UUID questionId, QuestionStatus status);

    Page<QuestionResponse> getQuestionsForModeration(QuestionStatus status, Pageable pageable);
}
