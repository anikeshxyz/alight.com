package com.alight.marketplace.modules.order.service;

import com.alight.marketplace.modules.cart.entity.Cart;
import com.alight.marketplace.modules.cart.entity.CartItem;
import com.alight.marketplace.modules.cart.repository.CartItemRepository;
import com.alight.marketplace.modules.cart.repository.CartRepository;
import com.alight.marketplace.modules.inventory.service.StockReservationService;
import com.alight.marketplace.modules.order.dto.CheckoutAddressDto;
import com.alight.marketplace.modules.order.dto.InitiateCheckoutRequest;
import com.alight.marketplace.modules.order.dto.OrderDto;
import com.alight.marketplace.modules.order.entity.*;
import com.alight.marketplace.modules.order.repository.OrderAddressRepository;
import com.alight.marketplace.modules.order.repository.OrderItemRepository;
import com.alight.marketplace.modules.order.repository.OrderRepository;
import com.alight.marketplace.modules.order.repository.VendorOrderRepository;
import com.alight.marketplace.modules.order.service.impl.CheckoutServiceImpl;
import com.alight.marketplace.modules.pricing.service.PricingService;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.entity.ProductVariant;
import com.alight.marketplace.modules.tax.service.TaxCalculationService;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CheckoutServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderAddressRepository orderAddressRepository;

    @Mock
    private VendorOrderRepository vendorOrderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private VendorRepository vendorRepository;

    @Mock
    private StockReservationService stockReservationService;

    @Mock
    private PricingService pricingService;

    @Mock
    private TaxCalculationService taxCalculationService;

    @Mock
    private com.alight.marketplace.modules.coupon.service.CouponService couponService;

    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private CheckoutServiceImpl checkoutService;

    private UUID userId;
    private User user;
    private Cart cart;
    private Vendor vendor;
    private Product product;
    private ProductVariant variant;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();

        user = User.builder()
                .id(userId)
                .email("buyer@test.com")
                .firstName("Aditya")
                .lastName("Verma")
                .phone("9876543210")
                .build();

        vendor = Vendor.builder()
                .id(UUID.randomUUID())
                .storeName("Titan Electronics")
                .commissionPercentage(BigDecimal.valueOf(8.0))
                .build();

        product = Product.builder()
                .id(UUID.randomUUID())
                .title("Smart Industrial Gateway")
                .slug("smart-industrial-gateway")
                .vendor(vendor)
                .build();

        variant = ProductVariant.builder()
                .id(UUID.randomUUID())
                .product(product)
                .variantSku("TITAN-GW-01")
                .variantName("Default")
                .price(BigDecimal.valueOf(2500.00))
                .build();

        cart = Cart.builder()
                .id(UUID.randomUUID())
                .user(user)
                .build();
    }

    @Test
    @DisplayName("Should successfully initiate checkout and generate Master Order & Vendor Sub-Orders")
    void shouldInitiateCheckoutSuccessfully() {
        CartItem cartItem = CartItem.builder()
                .id(UUID.randomUUID())
                .cart(cart)
                .product(product)
                .variant(variant)
                .quantity(2)
                .build();

        CheckoutAddressDto shippingAddress = CheckoutAddressDto.builder()
                .addressType(AddressType.SHIPPING)
                .fullName("Aditya Verma")
                .phone("9876543210")
                .addressLine1("Plot 42, Hinjewadi Phase 1")
                .city("Pune")
                .state("Maharashtra")
                .postalCode("411057")
                .country("IN")
                .build();

        InitiateCheckoutRequest request = InitiateCheckoutRequest.builder()
                .shippingAddress(shippingAddress)
                .paymentMethod("RAZORPAY")
                .notes("Handle with care")
                .build();

        when(cartRepository.findByUserId(userId)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartId(cart.getId())).thenReturn(List.of(cartItem));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(vendorRepository.findById(vendor.getId())).thenReturn(Optional.of(vendor));

        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            if (o.getId() == null) o.setId(UUID.randomUUID());
            return o;
        });

        when(vendorOrderRepository.save(any(VendorOrder.class))).thenAnswer(inv -> {
            VendorOrder vo = inv.getArgument(0);
            if (vo.getId() == null) vo.setId(UUID.randomUUID());
            return vo;
        });

        when(orderItemRepository.save(any(OrderItem.class))).thenAnswer(inv -> {
            OrderItem oi = inv.getArgument(0);
            if (oi.getId() == null) oi.setId(UUID.randomUUID());
            return oi;
        });

        when(orderAddressRepository.save(any(OrderAddress.class))).thenAnswer(inv -> {
            OrderAddress oa = inv.getArgument(0);
            if (oa.getId() == null) oa.setId(UUID.randomUUID());
            return oa;
        });

        OrderDto result = checkoutService.initiateCheckout(userId, request);

        assertThat(result).isNotNull();
        assertThat(result.getOrderNumber()).startsWith("ORD-");
        assertThat(result.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
        assertThat(result.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(result.getVendorOrders()).hasSize(1);
        assertThat(result.getItems()).hasSize(1);
        verify(cartItemRepository, times(1)).deleteByCartId(cart.getId());
        verify(stockReservationService, times(1)).confirmReservation(anyString());
    }
}
