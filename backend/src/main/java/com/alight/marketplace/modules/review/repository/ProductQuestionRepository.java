package com.alight.marketplace.modules.review.repository;

import com.alight.marketplace.modules.review.entity.ProductQuestion;
import com.alight.marketplace.modules.review.entity.QuestionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductQuestionRepository extends JpaRepository<ProductQuestion, UUID> {

    Page<ProductQuestion> findByProductIdAndStatus(UUID productId, QuestionStatus status, Pageable pageable);

    List<ProductQuestion> findByProductIdAndStatus(UUID productId, QuestionStatus status);

    Page<ProductQuestion> findByVendorId(UUID vendorId, Pageable pageable);

    Page<ProductQuestion> findByVendorIdAndStatus(UUID vendorId, QuestionStatus status, Pageable pageable);

    Page<ProductQuestion> findByUserId(UUID userId, Pageable pageable);

    Page<ProductQuestion> findByStatus(QuestionStatus status, Pageable pageable);

    long countByVendorId(UUID vendorId);
}
