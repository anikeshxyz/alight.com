package com.alight.marketplace.modules.order.service.impl;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.cart.entity.Cart;
import com.alight.marketplace.modules.cart.entity.CartItem;
import com.alight.marketplace.modules.cart.repository.CartItemRepository;
import com.alight.marketplace.modules.cart.repository.CartRepository;
import com.alight.marketplace.modules.cart.service.CartService;
import com.alight.marketplace.modules.coupon.dto.ApplyCouponRequestDto;
import com.alight.marketplace.modules.coupon.dto.CartItemContextDto;
import com.alight.marketplace.modules.coupon.dto.CouponValidationResponseDto;
import com.alight.marketplace.modules.coupon.service.CouponService;
import com.alight.marketplace.modules.inventory.dto.StockReservationRequest;
import com.alight.marketplace.modules.inventory.service.StockReservationService;
import com.alight.marketplace.modules.order.dto.*;
import com.alight.marketplace.modules.order.entity.*;
import com.alight.marketplace.modules.order.repository.OrderAddressRepository;
import com.alight.marketplace.modules.order.repository.OrderItemRepository;
import com.alight.marketplace.modules.order.repository.OrderRepository;
import com.alight.marketplace.modules.order.repository.VendorOrderRepository;
import com.alight.marketplace.modules.order.service.CheckoutService;
import com.alight.marketplace.modules.pricing.dto.PriceCalculationRequest;
import com.alight.marketplace.modules.pricing.dto.PriceCalculationResponse;
import com.alight.marketplace.modules.pricing.service.PricingService;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.entity.ProductImage;
import com.alight.marketplace.modules.product.entity.ProductVariant;
import com.alight.marketplace.modules.tax.dto.TaxCalculationRequest;
import com.alight.marketplace.modules.tax.dto.TaxCalculationResponse;
import com.alight.marketplace.modules.tax.service.TaxCalculationService;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.Year;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CheckoutServiceImpl implements CheckoutService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final CartService cartService;
    private final OrderRepository orderRepository;
    private final OrderAddressRepository orderAddressRepository;
    private final VendorOrderRepository vendorOrderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final StockReservationService stockReservationService;
    private final PricingService pricingService;
    private final TaxCalculationService taxCalculationService;
    private final CouponService couponService;
    private final com.alight.marketplace.modules.wishlist.service.WishlistService wishlistService;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    @Transactional(readOnly = true)
    public CheckoutSummaryDto previewCheckout(UUID userId, InitiateCheckoutRequest request) {
        var cartRes = cartService.getCart(userId, request.getGuestSessionId());
        if (cartRes.getItems().isEmpty()) {
            throw new BadRequestException("Cannot preview checkout with an empty cart");
        }

        for (var item : cartRes.getItems()) {
            if (item.getAvailableStock() != null && item.getAvailableStock() < item.getQuantity()) {
                throw new BadRequestException("Item '" + item.getProductTitle() + "' has insufficient stock (" + Math.max(0, item.getAvailableStock()) + " available, " + item.getQuantity() + " in cart)");
            }
        }

        return CheckoutSummaryDto.builder()
                .subtotalAmount(cartRes.getSubtotalAmount())
                .discountAmount(cartRes.getDiscountAmount())
                .taxAmount(cartRes.getEstimatedTaxAmount())
                .shippingAmount(cartRes.getEstimatedShippingAmount())
                .totalAmount(cartRes.getGrandTotal())
                .totalItems(cartRes.getTotalItems())
                .vendorGroups(cartRes.getVendorGroups())
                .build();
    }

    @Override
    @Transactional
    public OrderDto initiateCheckout(UUID userId, InitiateCheckoutRequest request) {
        Cart cart = resolveCart(userId, request.getGuestSessionId());
        if (cart == null) {
            throw new BadRequestException("Active cart not found for checkout");
        }

        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());
        if (cartItems.isEmpty()) {
            throw new BadRequestException("Cannot checkout with an empty cart");
        }

        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }

        String customerEmail = user != null ? user.getEmail() : "guest-" + UUID.randomUUID().toString().substring(0, 8) + "@alight.com";
        String customerPhone = (request.getShippingAddress() != null && request.getShippingAddress().getPhone() != null)
                ? request.getShippingAddress().getPhone()
                : (user != null && user.getPhone() != null ? user.getPhone() : "9876543210");
        String customerName = (request.getShippingAddress() != null && request.getShippingAddress().getFullName() != null)
                ? request.getShippingAddress().getFullName()
                : (user != null ? user.getFirstName() + " " + user.getLastName() : "Guest Customer");

        String destState = (request.getShippingAddress() != null && request.getShippingAddress().getState() != null)
                ? request.getShippingAddress().getState()
                : "Maharashtra";

        Map<UUID, List<CartItem>> itemsByVendor = new LinkedHashMap<>();
        for (CartItem ci : cartItems) {
            UUID vId = ci.getProduct().getVendor() != null ? ci.getProduct().getVendor().getId() : null;
            itemsByVendor.computeIfAbsent(vId, k -> new ArrayList<>()).add(ci);
        }

        String orderNumber = generateOrderNumber();

        // 1. Stock Reservation Hold (15 minutes)
        String reservationToken = "RES-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        for (CartItem ci : cartItems) {
            UUID variantId = ci.getVariant() != null ? ci.getVariant().getId() : null;
            try {
                stockReservationService.createReservation(
                        StockReservationRequest.builder()
                                .productId(ci.getProduct().getId())
                                .variantId(variantId)
                                .quantity(ci.getQuantity())
                                .reservationToken(reservationToken)
                                .build(),
                        customerEmail
                );
            } catch (Exception e) {
                log.error("Inventory reservation failed for product {} variant {}: {}", ci.getProduct().getTitle(), variantId, e.getMessage());
                stockReservationService.cancelReservation(reservationToken);
                throw new BadRequestException("Checkout cannot proceed: " + e.getMessage());
            }
        }

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .user(user)
                .customerEmail(customerEmail)
                .customerPhone(customerPhone)
                .customerName(customerName)
                .orderStatus(OrderStatus.CONFIRMED)
                .paymentStatus(PaymentStatus.PAID)
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "RAZORPAY")
                .currencyCode("INR")
                .notes(request.getNotes())
                .totalSubtotal(BigDecimal.ZERO)
                .totalDiscount(BigDecimal.ZERO)
                .totalTax(BigDecimal.ZERO)
                .totalShipping(BigDecimal.ZERO)
                .grandTotal(BigDecimal.ZERO)
                .build();

        Order savedOrder = orderRepository.save(order);

        // Save Shipping Address
        OrderAddress shippingAddr = mapAddress(request.getShippingAddress(), savedOrder, AddressType.SHIPPING);
        orderAddressRepository.save(shippingAddr);

        // Save Billing Address
        if (request.getBillingAddress() != null) {
            OrderAddress billingAddr = mapAddress(request.getBillingAddress(), savedOrder, AddressType.BILLING);
            orderAddressRepository.save(billingAddr);
        } else {
            OrderAddress billingAddr = mapAddress(request.getShippingAddress(), savedOrder, AddressType.BILLING);
            orderAddressRepository.save(billingAddr);
        }

        List<VendorOrderDto> vendorOrderDtos = new ArrayList<>();
        List<OrderItemDto> allOrderItemDtos = new ArrayList<>();
        int vendorIndex = 1;

        BigDecimal grandSubtotal = BigDecimal.ZERO;
        BigDecimal grandDiscount = BigDecimal.ZERO;
        BigDecimal grandTax = BigDecimal.ZERO;
        BigDecimal grandShipping = BigDecimal.ZERO;

        for (Map.Entry<UUID, List<CartItem>> entry : itemsByVendor.entrySet()) {
            UUID vendorId = entry.getKey();
            List<CartItem> vCartItems = entry.getValue();
            Vendor vendor = vendorId != null ? vendorRepository.findById(vendorId).orElse(null) : null;

            String subOrderNumber = orderNumber + "-V" + vendorIndex++;
            BigDecimal vSubtotal = BigDecimal.ZERO;
            BigDecimal vDiscount = BigDecimal.ZERO;
            BigDecimal vTax = BigDecimal.ZERO;

            String vendorOriginState = "Maharashtra";
            String vendorGst = "27AAAAA0000A1Z5";
            BigDecimal commRate = BigDecimal.valueOf(8.00);

            if (vendor != null) {
                if (vendor.getCommissionPercentage() != null) {
                    commRate = vendor.getCommissionPercentage();
                }
                if (vendor.getBusinessDetails() != null) {
                    if (vendor.getBusinessDetails().getTaxIdGstin() != null) {
                        vendorGst = vendor.getBusinessDetails().getTaxIdGstin();
                    }
                }
            }

            VendorOrder vendorOrder = VendorOrder.builder()
                    .masterOrder(savedOrder)
                    .vendor(vendor)
                    .subOrderNumber(subOrderNumber)
                    .fulfillmentStatus(FulfillmentStatus.PENDING)
                    .subtotal(BigDecimal.ZERO)
                    .discountAmount(BigDecimal.ZERO)
                    .taxAmount(BigDecimal.ZERO)
                    .shippingAmount(BigDecimal.ZERO)
                    .grandTotal(BigDecimal.ZERO)
                    .build();

            VendorOrder savedVendorOrder = vendorOrderRepository.save(vendorOrder);

            List<OrderItemDto> vOrderItemDtos = new ArrayList<>();

            for (CartItem ci : vCartItems) {
                Product p = ci.getProduct();
                ProductVariant pv = ci.getVariant();

                BigDecimal regularPrice = (pv != null && pv.getPrice() != null) ? pv.getPrice() : p.getBasePrice();
                BigDecimal unitPrice = regularPrice;
                BigDecimal lineDiscount = BigDecimal.ZERO;

                if (pv != null) {
                    try {
                        PriceCalculationResponse pRes = pricingService.calculatePrice(
                                PriceCalculationRequest.builder()
                                        .variantId(pv.getId())
                                        .quantity(ci.getQuantity())
                                        .build()
                        );
                        if (pRes != null && pRes.getEffectiveUnitPrice() != null) {
                            unitPrice = pRes.getEffectiveUnitPrice();
                            if (regularPrice.compareTo(unitPrice) > 0) {
                                lineDiscount = regularPrice.subtract(unitPrice).multiply(BigDecimal.valueOf(ci.getQuantity()));
                            }
                        }
                    } catch (Exception e) {
                        log.debug("Pricing error for variant {}: {}", pv.getId(), e.getMessage());
                    }
                }

                BigDecimal lineSubtotal = unitPrice.multiply(BigDecimal.valueOf(ci.getQuantity())).setScale(2, RoundingMode.HALF_UP);

                BigDecimal taxRate = BigDecimal.valueOf(18.00);
                BigDecimal lineTax = BigDecimal.ZERO;
                BigDecimal cgst = BigDecimal.ZERO;
                BigDecimal sgst = BigDecimal.ZERO;
                BigDecimal igst = BigDecimal.ZERO;

                try {
                    TaxCalculationResponse taxRes = taxCalculationService.calculateTax(
                            TaxCalculationRequest.builder()
                                    .unitPrice(unitPrice)
                                    .quantity(ci.getQuantity())
                                    .originState(vendorOriginState)
                                    .destinationState(destState)
                                    .hsnSacCode("8517")
                                    .build()
                    );
                    if (taxRes != null) {
                        lineTax = taxRes.getTotalTaxAmount() != null ? taxRes.getTotalTaxAmount() : BigDecimal.ZERO;
                        if (taxRes.getTotalTaxRatePercent() != null) {
                            taxRate = taxRes.getTotalTaxRatePercent();
                        }
                        if (Boolean.TRUE.equals(taxRes.getIsInterState())) {
                            igst = lineTax;
                        } else {
                            cgst = lineTax.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
                            sgst = lineTax.subtract(cgst);
                        }
                    }
                } catch (Exception e) {
                    log.debug("Tax fallback for order item: {}", e.getMessage());
                    lineTax = lineSubtotal.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                    if (vendorOriginState.equalsIgnoreCase(destState)) {
                        cgst = lineTax.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
                        sgst = lineTax.subtract(cgst);
                    } else {
                        igst = lineTax;
                    }
                }

                BigDecimal lineTotal = lineSubtotal.add(lineTax);

                String primaryImage = null;
                if (p.getImages() != null && !p.getImages().isEmpty()) {
                    primaryImage = p.getImages().stream()
                            .filter(ProductImage::isPrimary)
                            .findFirst()
                            .map(ProductImage::getImageUrl)
                            .orElse(p.getImages().get(0).getImageUrl());
                }

                OrderItem orderItem = OrderItem.builder()
                        .vendorOrder(savedVendorOrder)
                        .product(p)
                        .variant(pv)
                        .productTitle(p.getTitle())
                        .variantName(pv != null ? pv.getVariantName() : "Standard")
                        .sku(pv != null && pv.getVariantSku() != null ? pv.getVariantSku() : p.getSku())
                        .imageUrl(pv != null && pv.getImageUrl() != null ? pv.getImageUrl() : primaryImage)
                        .quantity(ci.getQuantity())
                        .unitPrice(unitPrice)
                        .subtotal(lineSubtotal)
                        .taxRate(taxRate)
                        .taxAmount(lineTax)
                        .grandTotal(lineTotal)
                        .build();

                OrderItem savedItem = orderItemRepository.save(orderItem);

                OrderItemDto itemDto = OrderItemDto.builder()
                        .id(savedItem.getId())
                        .orderId(savedOrder.getId())
                        .vendorOrderId(savedVendorOrder.getId())
                        .vendorId(vendor != null ? vendor.getId() : null)
                        .productId(p.getId())
                        .variantId(pv.getId())
                        .productTitle(p.getTitle())
                        .variantSku(pv.getVariantSku())
                        .variantName(pv.getVariantName())
                        .primaryImageUrl(primaryImage)
                        .hsnCode("8517")
                        .quantity(ci.getQuantity())
                        .unitPrice(unitPrice)
                        .regularPrice(regularPrice)
                        .discountAmount(lineDiscount)
                        .subtotalAmount(lineSubtotal)
                        .taxRate(taxRate)
                        .cgstAmount(cgst)
                        .sgstAmount(sgst)
                        .igstAmount(igst)
                        .totalTaxAmount(lineTax)
                        .totalAmount(lineTotal)
                        .build();

                vOrderItemDtos.add(itemDto);
                allOrderItemDtos.add(itemDto);

                vSubtotal = vSubtotal.add(lineSubtotal);
                vDiscount = vDiscount.add(lineDiscount);
                vTax = vTax.add(lineTax);
            }

            BigDecimal vShipping = vSubtotal.compareTo(BigDecimal.valueOf(10000)) >= 0 ? BigDecimal.ZERO : BigDecimal.valueOf(150.00);
            BigDecimal vGrandTotal = vSubtotal.add(vTax).add(vShipping).setScale(2, RoundingMode.HALF_UP);
            BigDecimal vCommission = vSubtotal.multiply(commRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal vPayout = vGrandTotal.subtract(vCommission).setScale(2, RoundingMode.HALF_UP);

            savedVendorOrder.setSubtotal(vSubtotal);
            savedVendorOrder.setDiscountAmount(vDiscount);
            savedVendorOrder.setTaxAmount(vTax);
            savedVendorOrder.setShippingAmount(vShipping);
            savedVendorOrder.setGrandTotal(vGrandTotal);
            savedVendorOrder.setCommissionRate(commRate);
            savedVendorOrder.setCommissionAmount(vCommission);
            savedVendorOrder.setPayoutAmount(vPayout);
            vendorOrderRepository.save(savedVendorOrder);

            vendorOrderDtos.add(VendorOrderDto.builder()
                    .id(savedVendorOrder.getId())
                    .orderId(savedOrder.getId())
                    .orderNumber(savedOrder.getOrderNumber())
                    .vendorId(vendor != null ? vendor.getId() : null)
                    .vendorStoreName(vendor != null ? vendor.getStoreName() : "Marketplace Seller")
                    .vendorGstNumber(vendorGst)
                    .vendorState(vendorOriginState)
                    .subOrderNumber(subOrderNumber)
                    .fulfillmentStatus(savedVendorOrder.getFulfillmentStatus())
                    .subtotalAmount(vSubtotal)
                    .discountAmount(vDiscount)
                    .taxAmount(vTax)
                    .shippingAmount(vShipping)
                    .commissionRate(commRate)
                    .commissionAmount(vCommission)
                    .vendorPayoutAmount(vPayout)
                    .items(vOrderItemDtos)
                    .build());

            grandSubtotal = grandSubtotal.add(vSubtotal);
            grandDiscount = grandDiscount.add(vDiscount);
            grandTax = grandTax.add(vTax);
            grandShipping = grandShipping.add(vShipping);
        }

        // Apply Coupon Discount if couponCode was provided
        UUID appliedCouponId = null;
        BigDecimal couponDiscount = BigDecimal.ZERO;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            try {
                List<CartItemContextDto> itemContexts = cartItems.stream().map(ci -> CartItemContextDto.builder()
                        .productId(ci.getProduct().getId())
                        .variantId(ci.getVariant().getId())
                        .vendorId(ci.getProduct().getVendor() != null ? ci.getProduct().getVendor().getId() : null)
                        .categoryId(ci.getProduct().getCategory() != null ? ci.getProduct().getCategory().getId() : null)
                        .lineTotal(ci.getVariant().getPrice().multiply(BigDecimal.valueOf(ci.getQuantity())))
                        .build()).toList();

                ApplyCouponRequestDto couponReq = ApplyCouponRequestDto.builder()
                        .couponCode(request.getCouponCode().trim())
                        .cartSubtotal(grandSubtotal)
                        .items(itemContexts)
                        .build();

                CouponValidationResponseDto valRes = couponService.validateAndCalculateDiscount(couponReq, customerEmail);
                if (valRes != null && valRes.isValid() && valRes.getDiscountAmount() != null) {
                    couponDiscount = valRes.getDiscountAmount();
                    appliedCouponId = valRes.getCouponId();
                }
            } catch (Exception e) {
                log.warn("Coupon application error during checkout for code {}: {}", request.getCouponCode(), e.getMessage());
            }
        }

        grandDiscount = grandDiscount.add(couponDiscount);
        BigDecimal grandTotal = grandSubtotal.subtract(couponDiscount).add(grandTax).add(grandShipping).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

        savedOrder.setTotalSubtotal(grandSubtotal);
        savedOrder.setTotalDiscount(grandDiscount);
        savedOrder.setTotalTax(grandTax);
        savedOrder.setTotalShipping(grandShipping);
        savedOrder.setGrandTotal(grandTotal);
        orderRepository.save(savedOrder);

        if (appliedCouponId != null) {
            try {
                couponService.recordCouponUsage(appliedCouponId, userId, savedOrder.getId(), couponDiscount);
            } catch (Exception e) {
                log.warn("Error recording coupon usage for order {}: {}", savedOrder.getId(), e.getMessage());
            }
        }

        try {
            stockReservationService.confirmReservation(reservationToken);
        } catch (Exception e) {
            log.warn("Error confirming stock reservation {}: {}", reservationToken, e.getMessage());
        }

        try {
            cart.getItems().clear();
            cart.setUpdatedAt(Instant.now());
            cartRepository.save(cart);
            cartItemRepository.deleteByCartId(cart.getId());
        } catch (Exception e) {
            log.warn("Error clearing cart after checkout: {}", e.getMessage());
        }

        // Clean up items from customer's wishlist upon order completion
        if (userId != null) {
            for (CartItem ci : cartItems) {
                if (ci.getProduct() != null && ci.getProduct().getId() != null) {
                    try {
                        wishlistService.removeFromWishlist(userId, ci.getProduct().getId());
                    } catch (Exception e) {
                        log.debug("Wishlist item cleanup ignored for user {}: {}", userId, e.getMessage());
                    }
                }
            }
        }

        // Publish domain event
        try {
            eventPublisher.publishEvent(com.alight.marketplace.common.event.OrderCreatedEvent.builder()
                    .orderId(savedOrder.getId())
                    .orderNumber(savedOrder.getOrderNumber())
                    .customerEmail(savedOrder.getCustomerEmail())
                    .grandTotal(savedOrder.getGrandTotal())
                    .timestamp(Instant.now())
                    .build());
        } catch (Exception e) {
            log.warn("Error publishing OrderCreatedEvent for order {}: {}", savedOrder.getOrderNumber(), e.getMessage());
        }

        UUID uId = savedOrder.getUser() != null ? savedOrder.getUser().getId() : null;

        return OrderDto.builder()
                .id(savedOrder.getId())
                .orderNumber(savedOrder.getOrderNumber())
                .userId(uId)
                .customerEmail(savedOrder.getCustomerEmail())
                .customerPhone(savedOrder.getCustomerPhone())
                .customerName(savedOrder.getCustomerName())
                .status(savedOrder.getOrderStatus())
                .paymentStatus(savedOrder.getPaymentStatus())
                .paymentMethod(savedOrder.getPaymentMethod())
                .subtotalAmount(grandSubtotal)
                .discountAmount(grandDiscount)
                .taxAmount(grandTax)
                .shippingAmount(grandShipping)
                .totalAmount(grandTotal)
                .currency(savedOrder.getCurrencyCode())
                .notes(savedOrder.getNotes())
                .shippingAddress(mapAddressDto(shippingAddr))
                .vendorOrders(vendorOrderDtos)
                .items(allOrderItemDtos)
                .build();
    }

    private Cart resolveCart(UUID userId, String guestSessionId) {
        if (userId != null) {
            return cartRepository.findByUserId(userId).orElse(null);
        }
        if (guestSessionId != null && !guestSessionId.isBlank()) {
            return cartRepository.findBySessionId(guestSessionId).orElse(null);
        }
        return null;
    }

    private String generateOrderNumber() {
        int year = Year.now().getValue();
        int randomDigits = 10000 + RANDOM.nextInt(90000);
        return "ORD-" + year + "-" + randomDigits;
    }

    private OrderAddress mapAddress(CheckoutAddressDto dto, Order order, AddressType type) {
        return OrderAddress.builder()
                .order(order)
                .addressType(type)
                .fullName(dto.getFullName())
                .phone(dto.getPhone())
                .addressLine1(dto.getAddressLine1())
                .addressLine2(dto.getAddressLine2())
                .city(dto.getCity())
                .state(dto.getState())
                .postalCode(dto.getPostalCode())
                .countryCode(dto.getCountry() != null ? dto.getCountry() : "IN")
                .build();
    }

    private CheckoutAddressDto mapAddressDto(OrderAddress addr) {
        if (addr == null) return null;
        return CheckoutAddressDto.builder()
                .id(addr.getId())
                .addressType(addr.getAddressType())
                .fullName(addr.getFullName())
                .phone(addr.getPhone())
                .addressLine1(addr.getAddressLine1())
                .addressLine2(addr.getAddressLine2())
                .city(addr.getCity())
                .state(addr.getState())
                .postalCode(addr.getPostalCode())
                .country(addr.getCountryCode())
                .build();
    }
}
