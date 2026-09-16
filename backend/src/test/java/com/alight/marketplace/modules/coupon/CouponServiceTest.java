package com.alight.marketplace.modules.coupon;

import com.alight.marketplace.modules.coupon.dto.ApplyCouponRequestDto;
import com.alight.marketplace.modules.coupon.dto.CartItemContextDto;
import com.alight.marketplace.modules.coupon.dto.CouponValidationResponseDto;
import com.alight.marketplace.modules.coupon.dto.CreateCouponDto;
import com.alight.marketplace.modules.coupon.entity.Coupon;
import com.alight.marketplace.modules.coupon.entity.CouponDiscountType;
import com.alight.marketplace.modules.coupon.entity.CouponScope;
import com.alight.marketplace.modules.coupon.repository.CouponRepository;
import com.alight.marketplace.modules.coupon.repository.CouponUsageRepository;
import com.alight.marketplace.modules.coupon.service.impl.CouponServiceImpl;
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
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CouponServiceTest {

    @Mock
    private CouponRepository couponRepository;
    @Mock
    private CouponUsageRepository couponUsageRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private VendorRepository vendorRepository;

    @InjectMocks
    private CouponServiceImpl couponService;

    private User mockUser;
    private Vendor mockVendor;
    private Coupon percentCoupon;
    private Coupon fixedCoupon;

    @BeforeEach
    void setUp() {
        mockUser = User.builder()
                .id(UUID.randomUUID())
                .email("customer@alight.com")
                .build();

        mockVendor = Vendor.builder()
                .id(UUID.randomUUID())
                .storeName("Alight Hardware Atelier")
                .build();

        percentCoupon = Coupon.builder()
                .id(UUID.randomUUID())
                .code("ARCHFEST20")
                .title("20% Off Architectural Hardware")
                .discountType(CouponDiscountType.PERCENTAGE)
                .discountValue(new BigDecimal("20.00"))
                .maxDiscountAmount(new BigDecimal("1000.00"))
                .minOrderAmount(new BigDecimal("2000.00"))
                .validFrom(Instant.now().minus(5, ChronoUnit.DAYS))
                .validUntil(Instant.now().plus(30, ChronoUnit.DAYS))
                .isActive(true)
                .scope(CouponScope.GLOBAL)
                .totalUsedCount(0)
                .usageLimitTotal(100)
                .usageLimitPerUser(2)
                .build();

        fixedCoupon = Coupon.builder()
                .id(UUID.randomUUID())
                .code("ATELIER500")
                .title("Flat ₹500 Off")
                .discountType(CouponDiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("500.00"))
                .minOrderAmount(new BigDecimal("3000.00"))
                .validFrom(Instant.now().minus(5, ChronoUnit.DAYS))
                .validUntil(Instant.now().plus(30, ChronoUnit.DAYS))
                .isActive(true)
                .scope(CouponScope.VENDOR)
                .vendor(mockVendor)
                .totalUsedCount(0)
                .usageLimitTotal(50)
                .usageLimitPerUser(1)
                .build();
    }

    @Test
    void testValidateAndCalculateDiscount_PercentageWithCap() {
        when(couponRepository.findByCodeIgnoreCase("ARCHFEST20")).thenReturn(Optional.of(percentCoupon));
        when(userRepository.findByEmail("customer@alight.com")).thenReturn(Optional.of(mockUser));
        when(couponUsageRepository.countByCouponIdAndUserId(percentCoupon.getId(), mockUser.getId())).thenReturn(0L);

        ApplyCouponRequestDto request = ApplyCouponRequestDto.builder()
                .couponCode("ARCHFEST20")
                .cartSubtotal(new BigDecimal("10000.00"))
                .shippingAmount(new BigDecimal("200.00"))
                .items(List.of(CartItemContextDto.builder()
                        .productId(UUID.randomUUID())
                        .vendorId(mockVendor.getId())
                        .quantity(2)
                        .unitPrice(new BigDecimal("5000.00"))
                        .lineTotal(new BigDecimal("10000.00"))
                        .build()))
                .build();

        CouponValidationResponseDto response = couponService.validateAndCalculateDiscount(request, "customer@alight.com");

        assertTrue(response.isValid());
        assertEquals("ARCHFEST20", response.getCouponCode());
        // 20% of 10,000 is 2,000, but capped at max 1,000
        assertEquals(new BigDecimal("1000.00"), response.getDiscountAmount());
        assertEquals(new BigDecimal("9000.00"), response.getRevisedSubtotal());
        assertEquals(new BigDecimal("9200.00"), response.getRevisedGrandTotal());
    }

    @Test
    void testValidateAndCalculateDiscount_FixedAmountBelowMinOrder() {
        when(couponRepository.findByCodeIgnoreCase("ATELIER500")).thenReturn(Optional.of(fixedCoupon));

        ApplyCouponRequestDto request = ApplyCouponRequestDto.builder()
                .couponCode("ATELIER500")
                .cartSubtotal(new BigDecimal("1500.00")) // Below 3,000 min order
                .items(List.of(CartItemContextDto.builder()
                        .productId(UUID.randomUUID())
                        .vendorId(mockVendor.getId())
                        .quantity(1)
                        .unitPrice(new BigDecimal("1500.00"))
                        .lineTotal(new BigDecimal("1500.00"))
                        .build()))
                .build();

        CouponValidationResponseDto response = couponService.validateAndCalculateDiscount(request, null);

        assertFalse(response.isValid());
        assertTrue(response.getMessage().contains("Minimum order amount"));
        assertEquals(BigDecimal.ZERO, response.getDiscountAmount());
    }

    @Test
    void testCreateVendorCoupon_Success() {
        when(vendorRepository.findByUserEmail("seller@alight.com")).thenReturn(Optional.of(mockVendor));
        when(couponRepository.existsByCodeIgnoreCase("SUMMER100")).thenReturn(false);
        when(couponRepository.save(any(Coupon.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreateCouponDto dto = CreateCouponDto.builder()
                .code("SUMMER100")
                .title("Summer 100 Off")
                .discountType(CouponDiscountType.FIXED_AMOUNT)
                .discountValue(new BigDecimal("100.00"))
                .minOrderAmount(new BigDecimal("1000.00"))
                .build();

        var created = couponService.createVendorCoupon("seller@alight.com", dto);

        assertNotNull(created);
        assertEquals("SUMMER100", created.getCode());
        assertEquals(CouponScope.VENDOR, created.getScope());
        assertEquals(mockVendor.getId(), created.getVendorId());
    }
}
