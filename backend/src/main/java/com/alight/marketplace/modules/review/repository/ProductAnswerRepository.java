package com.alight.marketplace.modules.review.repository;

import com.alight.marketplace.modules.review.entity.ProductAnswer;
import com.alight.marketplace.modules.review.entity.QuestionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductAnswerRepository extends JpaRepository<ProductAnswer, UUID> {

    List<ProductAnswer> findByQuestionIdAndStatusOrderByUpvotesDescCreatedAtAsc(UUID questionId, QuestionStatus status);

    List<ProductAnswer> findByQuestionId(UUID questionId);
}
