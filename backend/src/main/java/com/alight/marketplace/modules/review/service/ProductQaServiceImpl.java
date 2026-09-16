package com.alight.marketplace.modules.review.service;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.review.dto.*;
import com.alight.marketplace.modules.review.entity.*;
import com.alight.marketplace.modules.review.repository.ProductAnswerRepository;
import com.alight.marketplace.modules.review.repository.ProductQuestionRepository;
import com.alight.marketplace.modules.review.repository.QuestionVoteRepository;
import com.alight.marketplace.modules.user.entity.Role;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductQaServiceImpl implements ProductQaService {

    private final ProductQuestionRepository questionRepository;
    private final ProductAnswerRepository answerRepository;
    private final QuestionVoteRepository questionVoteRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;

    @Override
    @Transactional
    public QuestionResponse askQuestion(UUID userId, CreateQuestionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + request.getProductId()));

        ProductQuestion question = ProductQuestion.builder()
                .product(product)
                .user(user)
                .vendor(product.getVendor())
                .questionText(request.getQuestionText())
                .status(QuestionStatus.APPROVED)
                .build();

        question = questionRepository.save(question);

        return QuestionResponse.fromEntity(question, false);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<QuestionResponse> getProductQuestions(UUID productId, UUID currentUserId, Pageable pageable) {
        Page<ProductQuestion> questionsPage = questionRepository.findByProductIdAndStatus(productId, QuestionStatus.APPROVED, pageable);

        return questionsPage.map(q -> {
            boolean userUpvoted = false;
            if (currentUserId != null) {
                userUpvoted = questionVoteRepository.existsByQuestionIdAndUserId(q.getId(), currentUserId);
            }
            return QuestionResponse.fromEntity(q, userUpvoted);
        });
    }

    @Override
    @Transactional
    public AnswerResponse answerQuestion(UUID userId, UUID questionId, CreateAnswerRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        ProductQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + questionId));

        AuthorType authorType = AuthorType.CUSTOMER;
        boolean isVerifiedSeller = false;
        String authorName = user.getFirstName() + " " + (user.getLastName() != null ? user.getLastName() : "");
        authorName = authorName.trim();

        // Check if user is the product vendor
        Optional<Vendor> vendorOpt = vendorRepository.findByUserId(userId);
        if (vendorOpt.isPresent() && vendorOpt.get().getId().equals(question.getVendor().getId())) {
            authorType = AuthorType.VENDOR;
            isVerifiedSeller = true;
            authorName = vendorOpt.get().getStoreName() + " (Official Vendor)";
        } else {
            // Check if user has Admin role
            boolean isAdmin = user.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));
            if (isAdmin) {
                authorType = AuthorType.ADMIN;
                authorName = "Alight Marketplace Support";
            }
        }

        ProductAnswer answer = ProductAnswer.builder()
                .question(question)
                .user(user)
                .authorType(authorType)
                .authorName(authorName)
                .answerText(request.getAnswerText())
                .verifiedSeller(isVerifiedSeller)
                .accepted(isVerifiedSeller)
                .status(QuestionStatus.APPROVED)
                .build();

        answer = answerRepository.save(answer);

        return AnswerResponse.fromEntity(answer);
    }

    @Override
    @Transactional
    public QuestionResponse upvoteQuestion(UUID userId, UUID questionId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        ProductQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + questionId));

        Optional<QuestionVote> voteOpt = questionVoteRepository.findByQuestionIdAndUserId(questionId, userId);
        boolean userUpvoted;

        if (voteOpt.isPresent()) {
            // Toggle off
            questionVoteRepository.delete(voteOpt.get());
            question.setUpvotes(Math.max(0, question.getUpvotes() - 1));
            userUpvoted = false;
        } else {
            // Add upvote
            QuestionVote vote = QuestionVote.builder()
                    .question(question)
                    .user(user)
                    .build();
            questionVoteRepository.save(vote);
            question.setUpvotes(question.getUpvotes() + 1);
            userUpvoted = true;
        }

        question = questionRepository.save(question);
        return QuestionResponse.fromEntity(question, userUpvoted);
    }

    @Override
    @Transactional
    public AnswerResponse acceptAnswer(UUID vendorUserId, UUID answerId) {
        Vendor vendor = vendorRepository.findByUserId(vendorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found for user: " + vendorUserId));

        ProductAnswer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new ResourceNotFoundException("Answer not found: " + answerId));

        if (!answer.getQuestion().getVendor().getId().equals(vendor.getId())) {
            throw new BadRequestException("You can only accept answers for questions on your own products");
        }

        answer.setAccepted(true);
        answer = answerRepository.save(answer);

        return AnswerResponse.fromEntity(answer);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<QuestionResponse> getVendorQuestions(UUID vendorUserId, QuestionStatus status, Pageable pageable) {
        Vendor vendor = vendorRepository.findByUserId(vendorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found for user: " + vendorUserId));

        if (status != null) {
            return questionRepository.findByVendorIdAndStatus(vendor.getId(), status, pageable)
                    .map(QuestionResponse::fromEntity);
        }

        return questionRepository.findByVendorId(vendor.getId(), pageable)
                .map(QuestionResponse::fromEntity);
    }

    @Override
    @Transactional
    public QuestionResponse moderateQuestion(UUID questionId, QuestionStatus status) {
        ProductQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + questionId));

        question.setStatus(status);
        question = questionRepository.save(question);

        return QuestionResponse.fromEntity(question);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<QuestionResponse> getQuestionsForModeration(QuestionStatus status, Pageable pageable) {
        if (status != null) {
            return questionRepository.findByStatus(status, pageable).map(QuestionResponse::fromEntity);
        }
        return questionRepository.findAll(pageable).map(QuestionResponse::fromEntity);
    }
}
