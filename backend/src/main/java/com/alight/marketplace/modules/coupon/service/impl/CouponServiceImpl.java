package com.alight.marketplace.modules.coupon.service.impl;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.common.exception.UnauthorizedException;
import com.alight.marketplace.modules.category.entity.Category;
import com.alight.marketplace.modules.category.repository.CategoryRepository;
import com.alight.marketplace.modules.coupon.dto.*;
import com.alight.marketplace.modules.coupon.entity.Coupon;
import com.alight.marketplace.modules.coupon.entity.CouponDiscountType;
import com.alight.marketplace.modules.coupon.entity.CouponScope;
import com.alight.marketplace.modules.coupon.entity.CouponUsage;
import com.alight.marketplace.modules.coupon.repository.CouponRepository;
import com.alight.marketplace.modules.coupon.repository.CouponUsageRepository;
import com.alight.marketplace.modules.coupon.service.CouponService;
import com.alight.marketplace.modules.order.entity.Order;
import com.alight.marketplace.modules.order.repository.OrderRepository;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.repository.ProductRepository;
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

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    @Override
    @Transactional(readOnly = true)
    public CouponValidationResponseDto validateAndCalculateDiscount(ApplyCouponRequestDto request, String userEmail) {
        String code = request.getCouponCode().trim().toUpperCase(Locale.ROOT);
        Optional<Coupon> optCoupon = couponRepository.findByCodeIgnoreCase(code);

        if (optCoupon.isEmpty()) {
            return invalidResponse("Coupon code '" + code + "' does not exist");
        }

        Coupon coupon = optCoupon.get();
        Instant now = Instant.now();

        if (Boolean.FALSE.equals(coupon.getIsActive())) {
            return invalidResponse("Coupon code '" + code + "' is currently inactive");
        }

        if (coupon.getValidFrom() != null && coupon.getValidFrom().isAfter(now)) {
            return invalidResponse("Coupon code is not yet valid");
        }

        if (coupon.getValidUntil() != null && coupon.getValidUntil().isBefore(now)) {
            return invalidResponse("Coupon code has expired");
        }

        if (coupon.getUsageLimitTotal() != null && coupon.getTotalUsedCount() >= coupon.getUsageLimitTotal()) {
            return invalidResponse("Coupon total redemption limit has been reached");
        }

        User user = null;
        if (userEmail != null && !userEmail.isBlank()) {
            user = userRepository.findByEmail(userEmail).orElse(null);
        }

        if (coupon.getScope() == CouponScope.FIRST_ORDER && user != null) {
            long pastOrders = couponUsageRepository.countByUserId(user.getId());
            if (pastOrders > 0) {
                return invalidResponse("Coupon is valid only for first-time orders");
            }
        }

        if (user != null && coupon.getUsageLimitPerUser() != null) {
            long userUses = couponUsageRepository.countByCouponIdAndUserId(coupon.getId(), user.getId());
            if (userUses >= coupon.getUsageLimitPerUser()) {
                return invalidResponse("You have already reached the maximum usage limit for this coupon");
            }
        }

        // Scope validation & eligible item subtotal calculation
        BigDecimal eligibleSubtotal = BigDecimal.ZERO;
        List<CartItemContextDto> eligibleItems = new ArrayList<>();

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (CartItemContextDto item : request.getItems()) {
                boolean isItemEligible = false;
                switch (coupon.getScope()) {
                    case GLOBAL:
                    case FIRST_ORDER:
                        isItemEligible = true;
                        break;
                    case VENDOR:
                        isItemEligible = coupon.getVendor() != null && coupon.getVendor().getId().equals(item.getVendorId());
                        break;
                    case CATEGORY:
                        isItemEligible = coupon.getCategory() != null && coupon.getCategory().getId().equals(item.getCategoryId());
                        break;
                    case PRODUCT:
                        isItemEligible = coupon.getProduct() != null && coupon.getProduct().getId().equals(item.getProductId());
                        break;
                }

                if (isItemEligible) {
                    eligibleItems.add(item);
                    BigDecimal itemTotal = item.getLineTotal() != null 
                            ? item.getLineTotal() 
                            : item.getUnitPrice().multiply(new BigDecimal(item.getQuantity()));
                    eligibleSubtotal = eligibleSubtotal.add(itemTotal);
                }
            }

            if (eligibleItems.isEmpty() || eligibleSubtotal.compareTo(BigDecimal.ZERO) <= 0) {
                return invalidResponse("Coupon does not apply to any eligible items in your cart");
            }
        } else {
            eligibleSubtotal = request.getCartSubtotal();
        }

        // Min order amount check
        if (coupon.getMinOrderAmount() != null && eligibleSubtotal.compareTo(coupon.getMinOrderAmount()) < 0) {
            return invalidResponse("Minimum order amount of ₹" + coupon.getMinOrderAmount() + " required for this coupon");
        }

        // Calculate Discount
        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal shippingAmount = request.getShippingAmount() != null ? request.getShippingAmount() : BigDecimal.ZERO;
        BigDecimal revisedShipping = shippingAmount;

        if (coupon.getDiscountType() == CouponDiscountType.FREE_SHIPPING) {
            discountAmount = shippingAmount;
            revisedShipping = BigDecimal.ZERO;
        } else if (coupon.getDiscountType() == CouponDiscountType.PERCENTAGE) {
            BigDecimal rawDiscount = eligibleSubtotal
                    .multiply(coupon.getDiscountValue())
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

            if (coupon.getMaxDiscountAmount() != null && coupon.getMaxDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
                discountAmount = rawDiscount.min(coupon.getMaxDiscountAmount());
            } else {
                discountAmount = rawDiscount;
            }
        } else if (coupon.getDiscountType() == CouponDiscountType.FIXED_AMOUNT) {
            discountAmount = coupon.getDiscountValue().min(eligibleSubtotal);
        }

        // Multi-Vendor Split Breakdown
        List<VendorDiscountBreakdownDto> breakdowns = new ArrayList<>();
        if (!eligibleItems.isEmpty() && eligibleSubtotal.compareTo(BigDecimal.ZERO) > 0 && coupon.getDiscountType() != CouponDiscountType.FREE_SHIPPING) {
            Map<UUID, BigDecimal> vendorSubtotals = new HashMap<>();
            for (CartItemContextDto item : eligibleItems) {
                if (item.getVendorId() != null) {
                    BigDecimal itemTotal = item.getLineTotal() != null 
                            ? item.getLineTotal() 
                            : item.getUnitPrice().multiply(new BigDecimal(item.getQuantity()));
                    vendorSubtotals.put(item.getVendorId(), vendorSubtotals.getOrDefault(item.getVendorId(), BigDecimal.ZERO).add(itemTotal));
                }
            }

            for (Map.Entry<UUID, BigDecimal> entry : vendorSubtotals.entrySet()) {
                BigDecimal vSubtotal = entry.getValue();
                BigDecimal vShareRatio = vSubtotal.divide(eligibleSubtotal, 4, RoundingMode.HALF_UP);
                BigDecimal vDiscount = discountAmount.multiply(vShareRatio).setScale(2, RoundingMode.HALF_UP);

                String vendorName = vendorRepository.findById(entry.getKey())
                        .map(Vendor::getStoreName)
                        .orElse("Vendor");

                breakdowns.add(VendorDiscountBreakdownDto.builder()
                        .vendorId(entry.getKey())
                        .vendorStoreName(vendorName)
                        .eligibleSubtotal(vSubtotal)
                        .allocatedDiscount(vDiscount)
                        .build());
            }
        }

        BigDecimal revisedSubtotal = request.getCartSubtotal();
        if (coupon.getDiscountType() != CouponDiscountType.FREE_SHIPPING) {
            revisedSubtotal = request.getCartSubtotal().subtract(discountAmount);
            if (revisedSubtotal.compareTo(BigDecimal.ZERO) < 0) revisedSubtotal = BigDecimal.ZERO;
        }

        BigDecimal revisedGrandTotal = revisedSubtotal.add(revisedShipping);

        return CouponValidationResponseDto.builder()
                .valid(true)
                .message("Coupon applied successfully: " + coupon.getTitle())
                .couponId(coupon.getId())
                .couponCode(coupon.getCode())
                .title(coupon.getTitle())
                .discountType(coupon.getDiscountType())
                .discountValue(coupon.getDiscountValue())
                .discountAmount(discountAmount)
                .revisedSubtotal(revisedSubtotal)
                .revisedShipping(revisedShipping)
                .revisedGrandTotal(revisedGrandTotal)
                .vendorBreakdowns(breakdowns)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CouponDto> getAvailablePublicCoupons(String userEmail) {
        return couponRepository.findActivePublicCoupons(Instant.now()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void recordCouponUsage(UUID couponId, UUID userId, UUID orderId, BigDecimal discountAmount) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found"));

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        Order order = orderId != null ? orderRepository.findById(orderId).orElse(null) : null;

        CouponUsage usage = CouponUsage.builder()
                .coupon(coupon)
                .user(user)
                .order(order)
                .discountAmount(discountAmount)
                .build();

        couponUsageRepository.save(usage);
        coupon.setTotalUsedCount(coupon.getTotalUsedCount() + 1);
        couponRepository.save(coupon);
        log.info("Recorded redemption of coupon {} on order {}", coupon.getCode(), orderId);
    }

    @Override
    @Transactional
    public CouponDto createVendorCoupon(String vendorEmail, CreateCouponDto dto) {
        Vendor vendor = getVendorForEmail(vendorEmail);
        String code = dto.getCode().trim().toUpperCase(Locale.ROOT);

        if (couponRepository.existsByCodeIgnoreCase(code)) {
            throw new BadRequestException("Coupon code '" + code + "' already exists");
        }

        Coupon coupon = Coupon.builder()
                .code(code)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .discountType(dto.getDiscountType())
                .discountValue(dto.getDiscountValue())
                .maxDiscountAmount(dto.getMaxDiscountAmount())
                .minOrderAmount(dto.getMinOrderAmount() != null ? dto.getMinOrderAmount() : BigDecimal.ZERO)
                .usageLimitTotal(dto.getUsageLimitTotal())
                .usageLimitPerUser(dto.getUsageLimitPerUser() != null ? dto.getUsageLimitPerUser() : 1)
                .validFrom(dto.getValidFrom() != null ? dto.getValidFrom() : Instant.now())
                .validUntil(dto.getValidUntil())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .scope(CouponScope.VENDOR)
                .vendor(vendor)
                .createdBy(vendorEmail)
                .build();

        return mapToDto(couponRepository.save(coupon));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CouponDto> getVendorCoupons(String vendorEmail, Pageable pageable) {
        Vendor vendor = getVendorForEmail(vendorEmail);
        return couponRepository.findByVendorIdOrderByCreatedAtDesc(vendor.getId(), pageable)
                .map(this::mapToDto);
    }

    @Override
    @Transactional
    public CouponDto toggleVendorCoupon(UUID couponId, String vendorEmail) {
        Vendor vendor = getVendorForEmail(vendorEmail);
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found"));

        if (!coupon.getVendor().getId().equals(vendor.getId())) {
            throw new UnauthorizedException("Not authorized to modify this coupon");
        }

        coupon.setIsActive(!Boolean.TRUE.equals(coupon.getIsActive()));
        return mapToDto(couponRepository.save(coupon));
    }

    @Override
    @Transactional(readOnly = true)
    public CouponStatsSummaryDto getVendorCouponStats(String vendorEmail) {
        Vendor vendor = getVendorForEmail(vendorEmail);
        long total = couponRepository.countByVendorId(vendor.getId());
        long active = couponRepository.countByVendorIdAndIsActiveTrue(vendor.getId());
        return CouponStatsSummaryDto.builder()
                .totalCoupons(total)
                .activeCoupons(active)
                .totalRedemptions(0)
                .totalDiscountGranted(BigDecimal.ZERO)
                .build();
    }

    @Override
    @Transactional
    public CouponDto createAdminCoupon(CreateCouponDto dto, String adminEmail) {
        String code = dto.getCode().trim().toUpperCase(Locale.ROOT);
        if (couponRepository.existsByCodeIgnoreCase(code)) {
            throw new BadRequestException("Coupon code '" + code + "' already exists");
        }

        Vendor vendor = dto.getVendorId() != null ? vendorRepository.findById(dto.getVendorId()).orElse(null) : null;
        Category category = dto.getCategoryId() != null ? categoryRepository.findById(dto.getCategoryId()).orElse(null) : null;
        Product product = dto.getProductId() != null ? productRepository.findById(dto.getProductId()).orElse(null) : null;

        Coupon coupon = Coupon.builder()
                .code(code)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .discountType(dto.getDiscountType())
                .discountValue(dto.getDiscountValue())
                .maxDiscountAmount(dto.getMaxDiscountAmount())
                .minOrderAmount(dto.getMinOrderAmount() != null ? dto.getMinOrderAmount() : BigDecimal.ZERO)
                .usageLimitTotal(dto.getUsageLimitTotal())
                .usageLimitPerUser(dto.getUsageLimitPerUser() != null ? dto.getUsageLimitPerUser() : 1)
                .validFrom(dto.getValidFrom() != null ? dto.getValidFrom() : Instant.now())
                .validUntil(dto.getValidUntil())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .scope(dto.getScope() != null ? dto.getScope() : CouponScope.GLOBAL)
                .vendor(vendor)
                .category(category)
                .product(product)
                .createdBy(adminEmail)
                .build();

        return mapToDto(couponRepository.save(coupon));
    }

    @Override
    @Transactional
    public CouponDto updateAdminCoupon(UUID id, CreateCouponDto dto) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with id: " + id));

        if (dto.getTitle() != null) coupon.setTitle(dto.getTitle());
        if (dto.getDescription() != null) coupon.setDescription(dto.getDescription());
        if (dto.getDiscountType() != null) coupon.setDiscountType(dto.getDiscountType());
        if (dto.getDiscountValue() != null) coupon.setDiscountValue(dto.getDiscountValue());
        if (dto.getMaxDiscountAmount() != null) coupon.setMaxDiscountAmount(dto.getMaxDiscountAmount());
        if (dto.getMinOrderAmount() != null) coupon.setMinOrderAmount(dto.getMinOrderAmount());
        if (dto.getUsageLimitTotal() != null) coupon.setUsageLimitTotal(dto.getUsageLimitTotal());
        if (dto.getUsageLimitPerUser() != null) coupon.setUsageLimitPerUser(dto.getUsageLimitPerUser());
        if (dto.getValidFrom() != null) coupon.setValidFrom(dto.getValidFrom());
        if (dto.getValidUntil() != null) coupon.setValidUntil(dto.getValidUntil());
        if (dto.getIsActive() != null) coupon.setIsActive(dto.getIsActive());

        return mapToDto(couponRepository.save(coupon));
    }

    @Override
    @Transactional
    public void deleteAdminCoupon(UUID id) {
        if (!couponRepository.existsById(id)) {
            throw new ResourceNotFoundException("Coupon not found with id: " + id);
        }
        couponRepository.deleteById(id);
    }

    @Override
    @Transactional
    public CouponDto toggleAdminCoupon(UUID id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with id: " + id));
        coupon.setIsActive(!Boolean.TRUE.equals(coupon.getIsActive()));
        return mapToDto(couponRepository.save(coupon));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CouponDto> searchAdminCoupons(String searchTerm, Boolean activeOnly, Pageable pageable) {
        return couponRepository.searchAllAdmin((searchTerm != null && !searchTerm.isBlank()) ? searchTerm : null, activeOnly, pageable)
                .map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public CouponStatsSummaryDto getAdminCouponStats() {
        return CouponStatsSummaryDto.builder()
                .totalCoupons(couponRepository.count())
                .activeCoupons(couponRepository.findAll().stream().filter(c -> Boolean.TRUE.equals(c.getIsActive())).count())
                .totalRedemptions(couponUsageRepository.count())
                .totalDiscountGranted(BigDecimal.ZERO)
                .build();
    }

    private CouponValidationResponseDto invalidResponse(String message) {
        return CouponValidationResponseDto.builder()
                .valid(false)
                .message(message)
                .discountAmount(BigDecimal.ZERO)
                .build();
    }

    private Vendor getVendorForEmail(String email) {
        return vendorRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor profile not found"));
    }

    private CouponDto mapToDto(Coupon c) {
        return CouponDto.builder()
                .id(c.getId())
                .code(c.getCode())
                .title(c.getTitle())
                .description(c.getDescription())
                .discountType(c.getDiscountType())
                .discountValue(c.getDiscountValue())
                .maxDiscountAmount(c.getMaxDiscountAmount())
                .minOrderAmount(c.getMinOrderAmount())
                .usageLimitTotal(c.getUsageLimitTotal())
                .usageLimitPerUser(c.getUsageLimitPerUser())
                .totalUsedCount(c.getTotalUsedCount())
                .validFrom(c.getValidFrom())
                .validUntil(c.getValidUntil())
                .isActive(c.getIsActive())
                .scope(c.getScope())
                .vendorId(c.getVendor() != null ? c.getVendor().getId() : null)
                .vendorStoreName(c.getVendor() != null ? c.getVendor().getStoreName() : null)
                .categoryId(c.getCategory() != null ? c.getCategory().getId() : null)
                .categoryName(c.getCategory() != null ? c.getCategory().getName() : null)
                .productId(c.getProduct() != null ? c.getProduct().getId() : null)
                .productTitle(c.getProduct() != null ? c.getProduct().getTitle() : null)
                .createdBy(c.getCreatedBy())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
