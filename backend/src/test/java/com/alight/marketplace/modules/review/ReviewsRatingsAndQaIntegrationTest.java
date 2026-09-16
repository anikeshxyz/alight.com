package com.alight.marketplace.modules.review;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.modules.auth.dto.RegisterRequest;
import com.alight.marketplace.modules.auth.service.AuthService;
import com.alight.marketplace.modules.cart.dto.AddToCartRequest;
import com.alight.marketplace.modules.cart.service.CartService;
import com.alight.marketplace.modules.category.dto.CategoryDto;
import com.alight.marketplace.modules.category.dto.CreateCategoryRequest;
import com.alight.marketplace.modules.category.service.CategoryService;
import com.alight.marketplace.modules.inventory.dto.CreateWarehouseRequest;
import com.alight.marketplace.modules.inventory.dto.StockAdjustmentRequest;
import com.alight.marketplace.modules.inventory.dto.WarehouseDto;
import com.alight.marketplace.modules.inventory.entity.TransactionType;
import com.alight.marketplace.modules.inventory.service.InventoryService;
import com.alight.marketplace.modules.inventory.service.WarehouseService;
import com.alight.marketplace.modules.order.dto.CheckoutAddressDto;
import com.alight.marketplace.modules.order.dto.InitiateCheckoutRequest;
import com.alight.marketplace.modules.order.dto.OrderDto;
import com.alight.marketplace.modules.order.service.CheckoutService;
import com.alight.marketplace.modules.product.dto.CreateProductRequest;
import com.alight.marketplace.modules.product.dto.ProductResponseDto;
import com.alight.marketplace.modules.product.dto.ProductVariantDto;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.product.service.VendorProductService;
import com.alight.marketplace.modules.review.dto.*;
import com.alight.marketplace.modules.review.entity.AuthorType;
import com.alight.marketplace.modules.review.entity.QuestionStatus;
import com.alight.marketplace.modules.review.entity.ReviewStatus;
import com.alight.marketplace.modules.review.entity.VoteType;
import com.alight.marketplace.modules.review.service.ProductQaService;
import com.alight.marketplace.modules.review.service.ReviewService;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.dto.UpdateVendorStatusRequest;
import com.alight.marketplace.modules.vendor.dto.VendorApplicationRequest;
import com.alight.marketplace.modules.vendor.dto.VendorResponseDto;
import com.alight.marketplace.modules.vendor.entity.BusinessType;
import com.alight.marketplace.modules.vendor.entity.VendorStatus;
import com.alight.marketplace.modules.vendor.service.AdminVendorService;
import com.alight.marketplace.modules.vendor.service.VendorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
@Transactional
class ReviewsRatingsAndQaIntegrationTest {

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private ProductQaService productQaService;

    @Autowired
    private CheckoutService checkoutService;

    @Autowired
    private CartService cartService;

    @Autowired
    private AuthService authService;

    @Autowired
    private VendorService vendorService;

    @Autowired
    private AdminVendorService adminVendorService;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private VendorProductService vendorProductService;

    @Autowired
    private WarehouseService warehouseService;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    private User buyer1;
    private User buyer2;
    private User vendorUser;
    private User otherVendorUser;
    private String vendorEmail;
    private String otherVendorEmail;
    private VendorResponseDto vendor;
    private CategoryDto category;
    private ProductResponseDto product;
    private ProductVariantDto variant;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String buyer1Email = "buyer1_rev_" + suffix + "@alight.com";
        String buyer2Email = "buyer2_rev_" + suffix + "@alight.com";
        vendorEmail = "vendor_rev_" + suffix + "@alight.com";
        otherVendorEmail = "othervendor_rev_" + suffix + "@alight.com";

        authService.register(RegisterRequest.builder()
                .email(buyer1Email)
                .password("Password123!")
                .firstName("Verified")
                .lastName("Buyer")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("CUSTOMER")
                .build());
        buyer1 = userRepository.findByEmail(buyer1Email).orElseThrow();

        authService.register(RegisterRequest.builder()
                .email(buyer2Email)
                .password("Password123!")
                .firstName("Community")
                .lastName("Reviewer")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("CUSTOMER")
                .build());
        buyer2 = userRepository.findByEmail(buyer2Email).orElseThrow();

        authService.register(RegisterRequest.builder()
                .email(vendorEmail)
                .password("Password123!")
                .firstName("Master")
                .lastName("Artisan")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("VENDOR")
                .build());
        vendorUser = userRepository.findByEmail(vendorEmail).orElseThrow();

        authService.register(RegisterRequest.builder()
                .email(otherVendorEmail)
                .password("Password123!")
                .firstName("Other")
                .lastName("Vendor")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("VENDOR")
                .build());
        otherVendorUser = userRepository.findByEmail(otherVendorEmail).orElseThrow();

        vendor = vendorService.applyAsVendor(vendorEmail, VendorApplicationRequest.builder()
                .storeName("Solid Oak Atelier " + suffix)
                .description("Handcrafted solid wood products")
                .supportEmail(vendorEmail)
                .supportPhone("+15557778899")
                .legalBusinessName("Solid Oak Atelier Pvt Ltd")
                .businessType(BusinessType.PRIVATE_LIMITED)
                .bankAccountNumber("556677889900")
                .bankIfscCode("HDFC0005566")
                .bankName("HDFC")
                .bankAccountHolderName("Solid Oak Atelier Pvt Ltd")
                .pickupContactPerson("Lead Carver")
                .pickupContactPhone("+15557778899")
                .pickupAddressLine1("Woodworks St 12")
                .pickupCity("Jaipur")
                .pickupState("Rajasthan")
                .pickupPostalCode("302001")
                .pickupCountry("India")
                .build());
        adminVendorService.updateVendorStatus(vendor.getId(), UpdateVendorStatusRequest.builder().status(VendorStatus.APPROVED).build());

        VendorResponseDto otherVendor = vendorService.applyAsVendor(otherVendorEmail, VendorApplicationRequest.builder()
                .storeName("Rival Store " + suffix)
                .description("Rival testing store")
                .supportEmail(otherVendorEmail)
                .supportPhone("+15559998877")
                .legalBusinessName("Rival Store Pvt Ltd")
                .businessType(BusinessType.PRIVATE_LIMITED)
                .bankAccountNumber("998877665544")
                .bankIfscCode("ICIC0009988")
                .bankName("ICICI")
                .bankAccountHolderName("Rival Store Pvt Ltd")
                .pickupContactPerson("Rival Lead")
                .pickupContactPhone("+15559998877")
                .pickupAddressLine1("Rival St 1")
                .pickupCity("Jaipur")
                .pickupState("Rajasthan")
                .pickupPostalCode("302001")
                .pickupCountry("India")
                .build());
        adminVendorService.updateVendorStatus(otherVendor.getId(), UpdateVendorStatusRequest.builder().status(VendorStatus.APPROVED).build());

        category = categoryService.createCategory(CreateCategoryRequest.builder()
                .name("Woodcraft " + suffix)
                .active(true)
                .build());

        WarehouseDto wh = warehouseService.createVendorWarehouse(CreateWarehouseRequest.builder()
                .name("Jaipur Hub " + suffix)
                .code("WH-JPR-" + suffix.toUpperCase())
                .addressLine1("Wood Hub 1")
                .city("Jaipur")
                .state("Rajasthan")
                .postalCode("302001")
                .countryCode("IN")
                .primary(true)
                .active(true)
                .build(), vendorEmail);

        product = vendorProductService.createProduct(vendorEmail, CreateProductRequest.builder()
                .categoryId(category.getId())
                .title("Teak Wood Dining Table " + suffix)
                .basePrice(new BigDecimal("15000.00"))
                .sku("TBL-" + suffix.toUpperCase())
                .stockQuantity(20)
                .variants(List.of(ProductVariantDto.builder()
                        .variantSku("TBL-NAT-" + suffix.toUpperCase())
                        .variantName("Natural Polish")
                        .price(new BigDecimal("15000.00"))
                        .stockQuantity(20)
                        .active(true)
                        .build()))
                .build());
        variant = product.getVariants().get(0);

        productRepository.findById(product.getId()).ifPresent(p -> {
            p.setStatus(ProductStatus.ACTIVE);
            productRepository.save(p);
        });

        inventoryService.adjustStock(StockAdjustmentRequest.builder()
                .warehouseId(wh.getId())
                .productId(product.getId())
                .variantId(variant.getId())
                .transactionType(TransactionType.INBOUND_RECEIPT)
                .quantity(10)
                .build(), vendorEmail);
    }

    private void createPurchaseForBuyer1() {
        cartService.addItem(buyer1.getId(), AddToCartRequest.builder()
                .variantId(variant.getId())
                .quantity(1)
                .build());

        checkoutService.initiateCheckout(buyer1.getId(), InitiateCheckoutRequest.builder()
                .paymentMethod("RAZORPAY")
                .shippingAddress(CheckoutAddressDto.builder()
                        .fullName("Verified Buyer")
                        .phone("9876543210")
                        .addressLine1("Lake View Villa 4")
                        .city("Jaipur")
                        .state("Rajasthan")
                        .postalCode("302001")
                        .country("IN")
                        .build())
                .build());
    }

    @Test
    @DisplayName("Stage 17: Customer creates review with Verified Purchase badge and media attachments")
    void testCreateReviewVerifiedAndUnverified() {
        // 1. Buyer 1 has ordered the product -> verified purchase
        createPurchaseForBuyer1();

        ReviewResponse verifiedReview = reviewService.createReview(buyer1.getId(), CreateReviewRequest.builder()
                .productId(product.getId())
                .rating(5)
                .title("Exquisite Craftsmanship")
                .comment("Solid teak wood, gorgeous finish and very sturdy.")
                .images(List.of("https://storage.alight.com/reviews/table1.jpg", "https://storage.alight.com/reviews/table2.jpg"))
                .build());

        assertNotNull(verifiedReview);
        assertNotNull(verifiedReview.getId());
        assertEquals(5, verifiedReview.getRating());
        assertTrue(verifiedReview.isVerifiedPurchase());
        assertEquals(2, verifiedReview.getImages().size());
        assertEquals(ReviewStatus.APPROVED, verifiedReview.getStatus());

        // 2. Buyer 2 has NOT ordered the product -> unverified review
        ReviewResponse unverifiedReview = reviewService.createReview(buyer2.getId(), CreateReviewRequest.builder()
                .productId(product.getId())
                .rating(4)
                .title("Looks great in showroom")
                .comment("Saw this in person, great quality.")
                .build());

        assertNotNull(unverifiedReview);
        assertEquals(4, unverifiedReview.getRating());
        assertFalse(unverifiedReview.isVerifiedPurchase());

        // 3. Verify product cached rating is updated
        Product updatedProduct = productRepository.findById(product.getId()).orElseThrow();
        assertEquals(2, updatedProduct.getReviewCount());
        // Average of 5 and 4 = 4.50
        assertEquals(new BigDecimal("4.50"), updatedProduct.getAverageRating());
    }

    @Test
    @DisplayName("Stage 17: Product review statistics and rating breakdown computation")
    void testProductReviewStats() {
        createPurchaseForBuyer1();

        // 5-star review with photos
        reviewService.createReview(buyer1.getId(), CreateReviewRequest.builder()
                .productId(product.getId())
                .rating(5)
                .title("Amazing Table")
                .comment("Outstanding texture and quality")
                .images(List.of("https://storage.alight.com/reviews/table.jpg"))
                .build());

        // 4-star review
        reviewService.createReview(buyer2.getId(), CreateReviewRequest.builder()
                .productId(product.getId())
                .rating(4)
                .title("Good Table")
                .comment("Good value for money")
                .build());

        ReviewStatsResponse stats = reviewService.getProductReviewStats(product.getId());

        assertNotNull(stats);
        assertEquals(product.getId(), stats.getProductId());
        assertEquals(2, stats.getTotalReviews());
        assertEquals(4.50, stats.getAverageRating(), 0.01);
        assertEquals(1, stats.getVerifiedPurchasesCount());
        assertEquals(1, stats.getWithPhotosCount());
        assertEquals(1, stats.getRatingBreakdown().get(5));
        assertEquals(1, stats.getRatingBreakdown().get(4));
        assertEquals(0, stats.getRatingBreakdown().get(1));
        assertEquals(50.0, stats.getRatingPercentages().get(5), 0.1);
        assertEquals(50.0, stats.getRatingPercentages().get(4), 0.1);
    }

    @Test
    @DisplayName("Stage 17: Review helpful/unhelpful voting with toggling and switching")
    void testReviewVotingMechanics() {
        createPurchaseForBuyer1();
        ReviewResponse created = reviewService.createReview(buyer1.getId(), CreateReviewRequest.builder()
                .productId(product.getId())
                .rating(5)
                .title("Solid Build")
                .comment("Very sturdy legs and smooth top")
                .build());

        // 1. Buyer 2 votes HELPFUL
        ReviewResponse votedHelpful = reviewService.voteReview(buyer2.getId(), created.getId(),
                VoteRequest.builder().voteType(VoteType.HELPFUL).build());
        assertEquals(1, votedHelpful.getHelpfulCount());
        assertEquals(0, votedHelpful.getUnhelpfulCount());
        assertEquals("HELPFUL", votedHelpful.getUserVote());

        // 2. Buyer 2 switches vote to UNHELPFUL
        ReviewResponse switchedVote = reviewService.voteReview(buyer2.getId(), created.getId(),
                VoteRequest.builder().voteType(VoteType.UNHELPFUL).build());
        assertEquals(0, switchedVote.getHelpfulCount());
        assertEquals(1, switchedVote.getUnhelpfulCount());
        assertEquals("UNHELPFUL", switchedVote.getUserVote());

        // 3. Buyer 2 clicks UNHELPFUL again -> removes vote (toggles off)
        ReviewResponse unvoted = reviewService.voteReview(buyer2.getId(), created.getId(),
                VoteRequest.builder().voteType(VoteType.UNHELPFUL).build());
        assertEquals(0, unvoted.getHelpfulCount());
        assertEquals(0, unvoted.getUnhelpfulCount());
        assertNull(unvoted.getUserVote());
    }

    @Test
    @DisplayName("Stage 17: Vendor official response to customer reviews and multi-tenant security isolation")
    void testVendorReplyToReview() {
        createPurchaseForBuyer1();
        ReviewResponse created = reviewService.createReview(buyer1.getId(), CreateReviewRequest.builder()
                .productId(product.getId())
                .rating(5)
                .title("Wonderful Dining Table")
                .comment("We love eating dinner on this table every evening.")
                .build());

        // 1. Rival vendor tries to reply -> rejected
        assertThrows(BadRequestException.class, () -> reviewService.replyToReview(otherVendorUser.getId(), created.getId(),
                VendorReplyRequest.builder().responseText("Spam reply").build()));

        // 2. Official vendor replies -> accepted
        ReviewResponse replied = reviewService.replyToReview(vendorUser.getId(), created.getId(),
                VendorReplyRequest.builder().responseText("Thank you for your heartfelt review! We take pride in our woodwork.").build());

        assertNotNull(replied.getVendorResponse());
        assertEquals("Thank you for your heartfelt review! We take pride in our woodwork.", replied.getVendorResponse());
        assertNotNull(replied.getVendorRespondedAt());
    }

    @Test
    @DisplayName("Stage 17: Admin review moderation workflow and rating recalculation")
    void testAdminReviewModeration() {
        ReviewResponse rev = reviewService.createReview(buyer2.getId(), CreateReviewRequest.builder()
                .productId(product.getId())
                .rating(1)
                .title("Spam link")
                .comment("Visit spamwebsite.com for free cash!")
                .build());

        assertEquals(1, productRepository.findById(product.getId()).orElseThrow().getReviewCount());

        // Admin flags as FLAGGED_SPAM
        ReviewResponse moderated = reviewService.moderateReview(rev.getId(),
                ReviewModerationRequest.builder().status(ReviewStatus.FLAGGED_SPAM).build());
        assertEquals(ReviewStatus.FLAGGED_SPAM, moderated.getStatus());

        // Verify that product review count excluding spam becomes 0
        Product productAfterModeration = productRepository.findById(product.getId()).orElseThrow();
        assertEquals(0, productAfterModeration.getReviewCount());
        assertEquals(BigDecimal.ZERO, productAfterModeration.getAverageRating());
    }

    @Test
    @DisplayName("Stage 17: Product Community Q&A lifecycle with seller verification and upvoting")
    void testProductQaLifecycle() {
        // 1. Buyer 1 asks a question
        QuestionResponse question = productQaService.askQuestion(buyer1.getId(), CreateQuestionRequest.builder()
                .productId(product.getId())
                .questionText("Does this table require assembly upon delivery?")
                .build());

        assertNotNull(question);
        assertNotNull(question.getId());
        assertEquals("Does this table require assembly upon delivery?", question.getQuestionText());
        assertEquals(QuestionStatus.APPROVED, question.getStatus());
        assertEquals(0, question.getUpvotes());

        // 2. Buyer 2 upvotes the question
        QuestionResponse upvoted = productQaService.upvoteQuestion(buyer2.getId(), question.getId());
        assertEquals(1, upvoted.getUpvotes());
        assertTrue(upvoted.isUserUpvoted());

        // 3. Official Vendor answers the question (marked as verified seller)
        AnswerResponse vendorAnswer = productQaService.answerQuestion(vendorUser.getId(), question.getId(),
                CreateAnswerRequest.builder().answerText("Our delivery team provides complimentary assembly at your home!").build());

        assertNotNull(vendorAnswer);
        assertEquals(AuthorType.VENDOR, vendorAnswer.getAuthorType());
        assertTrue(vendorAnswer.isVerifiedSeller());
        assertTrue(vendorAnswer.isAccepted());

        // 4. Query questions for product
        Page<QuestionResponse> productQuestions = productQaService.getProductQuestions(product.getId(), buyer2.getId(), PageRequest.of(0, 10));
        assertEquals(1, productQuestions.getTotalElements());
        QuestionResponse fetchedQ = productQuestions.getContent().get(0);
        assertTrue(fetchedQ.isUserUpvoted());
        assertEquals(1, fetchedQ.getAnswers().size());
        assertTrue(fetchedQ.getAnswers().get(0).isVerifiedSeller());
    }
}
