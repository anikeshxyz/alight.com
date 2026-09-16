package com.alight.marketplace.modules.review;

import com.alight.marketplace.modules.order.repository.OrderItemRepository;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.review.dto.*;
import com.alight.marketplace.modules.review.entity.Review;
import com.alight.marketplace.modules.review.entity.ReviewStatus;
import com.alight.marketplace.modules.review.entity.ReviewVote;
import com.alight.marketplace.modules.review.entity.VoteType;
import com.alight.marketplace.modules.review.repository.ReviewRepository;
import com.alight.marketplace.modules.review.repository.ReviewVoteRepository;
import com.alight.marketplace.modules.review.service.ReviewServiceImpl;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ReviewVoteRepository reviewVoteRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private VendorRepository vendorRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    private User customer;
    private Vendor vendor;
    private Product product;
    private Review review;
    private UUID userId;
    private UUID productId;
    private UUID vendorId;
    private UUID reviewId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        productId = UUID.randomUUID();
        vendorId = UUID.randomUUID();
        reviewId = UUID.randomUUID();

        customer = User.builder()
                .id(userId)
                .email("test@customer.com")
                .firstName("Test")
                .lastName("Customer")
                .build();

        vendor = Vendor.builder()
                .id(vendorId)
                .storeName("Precision Hardware")
                .build();

        product = Product.builder()
                .id(productId)
                .title("Architectural Hinge")
                .vendor(vendor)
                .averageRating(BigDecimal.ZERO)
                .reviewCount(0)
                .build();

        review = Review.builder()
                .id(reviewId)
                .product(product)
                .user(customer)
                .vendor(vendor)
                .rating(5)
                .title("Top quality")
                .comment("Excellent build")
                .verifiedPurchase(true)
                .status(ReviewStatus.APPROVED)
                .helpfulCount(3)
                .unhelpfulCount(0)
                .build();
    }

    @Test
    void testCreateReview_VerifiedBuyer_Success() {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .productId(productId)
                .rating(5)
                .title("Outstanding quality")
                .comment("Extremely durable and smooth")
                .images(List.of("https://example.com/photo.jpg"))
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(customer));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(orderItemRepository.hasUserPurchasedProduct(productId, userId)).thenReturn(true);
        when(reviewRepository.findByProductIdAndUserId(productId, userId)).thenReturn(Optional.empty());
        when(reviewRepository.save(any(Review.class))).thenAnswer(invocation -> {
            Review r = invocation.getArgument(0);
            r.setId(reviewId);
            return r;
        });
        when(reviewRepository.findByProductIdAndStatus(productId, ReviewStatus.APPROVED)).thenReturn(List.of(review));

        ReviewResponse response = reviewService.createReview(userId, request);

        assertNotNull(response);
        assertEquals(5, response.getRating());
        assertTrue(response.isVerifiedPurchase());
        verify(reviewRepository).save(any(Review.class));
        verify(productRepository).save(any(Product.class));
    }

    @Test
    void testGetProductReviewStats() {
        Review r1 = Review.builder().rating(5).verifiedPurchase(true).images(List.of("img1")).status(ReviewStatus.APPROVED).build();
        Review r2 = Review.builder().rating(4).verifiedPurchase(true).images(Collections.emptyList()).status(ReviewStatus.APPROVED).build();
        Review r3 = Review.builder().rating(5).verifiedPurchase(false).images(Collections.emptyList()).status(ReviewStatus.APPROVED).build();

        when(reviewRepository.findByProductIdAndStatus(productId, ReviewStatus.APPROVED))
                .thenReturn(List.of(r1, r2, r3));

        ReviewStatsResponse stats = reviewService.getProductReviewStats(productId);

        assertNotNull(stats);
        assertEquals(3, stats.getTotalReviews());
        assertEquals(4.67, stats.getAverageRating(), 0.01);
        assertEquals(2, stats.getRatingBreakdown().get(5));
        assertEquals(1, stats.getRatingBreakdown().get(4));
        assertEquals(2, stats.getVerifiedPurchasesCount());
        assertEquals(1, stats.getWithPhotosCount());
    }

    @Test
    void testVoteReview_HelpfulToggle() {
        VoteRequest request = VoteRequest.builder().voteType(VoteType.HELPFUL).build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(customer));
        when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(review));
        when(reviewVoteRepository.findByReviewIdAndUserId(reviewId, userId)).thenReturn(Optional.empty());
        when(reviewRepository.save(any(Review.class))).thenReturn(review);

        ReviewResponse res = reviewService.voteReview(userId, reviewId, request);

        assertNotNull(res);
        assertEquals("HELPFUL", res.getUserVote());
        verify(reviewVoteRepository).save(any(ReviewVote.class));
    }

    @Test
    void testVendorReply_Success() {
        UUID vendorUserId = UUID.randomUUID();
        VendorReplyRequest request = VendorReplyRequest.builder()
                .responseText("Thank you for your valuable feedback!")
                .build();

        when(vendorRepository.findByUserId(vendorUserId)).thenReturn(Optional.of(vendor));
        when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(review));
        when(reviewRepository.save(any(Review.class))).thenReturn(review);

        ReviewResponse res = reviewService.replyToReview(vendorUserId, reviewId, request);

        assertNotNull(res);
        assertEquals("Thank you for your valuable feedback!", review.getVendorResponse());
        assertNotNull(review.getVendorRespondedAt());
    }
}
