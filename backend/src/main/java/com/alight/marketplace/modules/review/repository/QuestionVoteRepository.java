package com.alight.marketplace.modules.review.repository;

import com.alight.marketplace.modules.review.entity.QuestionVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuestionVoteRepository extends JpaRepository<QuestionVote, UUID> {

    Optional<QuestionVote> findByQuestionIdAndUserId(UUID questionId, UUID userId);

    boolean existsByQuestionIdAndUserId(UUID questionId, UUID userId);

    void deleteByQuestionIdAndUserId(UUID questionId, UUID userId);
}
