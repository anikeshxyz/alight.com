package com.alight.marketplace.modules.cart.service;

import com.alight.marketplace.modules.cart.dto.AddToCartRequest;
import com.alight.marketplace.modules.cart.dto.CartResponseDto;
import com.alight.marketplace.modules.cart.dto.UpdateCartItemRequest;
import com.alight.marketplace.modules.cart.entity.Cart;
import com.alight.marketplace.modules.cart.entity.CartItem;
import com.alight.marketplace.modules.cart.repository.CartItemRepository;
import com.alight.marketplace.modules.cart.repository.CartRepository;
import com.alight.marketplace.modules.cart.service.impl.CartServiceImpl;
import com.alight.marketplace.modules.inventory.repository.WarehouseStockRepository;
import com.alight.marketplace.modules.pricing.service.PricingService;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import com.alight.marketplace.modules.product.entity.ProductVariant;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.product.repository.ProductVariantRepository;
import com.alight.marketplace.modules.tax.service.TaxCalculationService;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductVariantRepository productVariantRepository;

    @Mock
    private WarehouseStockRepository warehouseStockRepository;

    @Mock
    private PricingService pricingService;

    @Mock
    private TaxCalculationService taxCalculationService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CartServiceImpl cartService;

    private UUID userId;
    private UUID variantId;
    private UUID productId;
    private User user;
    private Product product;
    private ProductVariant variant;
    private Vendor vendor;
    private Cart cart;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        variantId = UUID.randomUUID();
        productId = UUID.randomUUID();

        user = User.builder()
                .id(userId)
                .email("buyer@test.com")
                .firstName("Test")
                .lastName("Buyer")
                .build();

        vendor = Vendor.builder()
                .id(UUID.randomUUID())
                .storeName("Apex Industrial Supplies")
                .commissionPercentage(BigDecimal.valueOf(8.0))
                .build();

        product = Product.builder()
                .id(productId)
                .title("Industrial Precision Multimeter")
                .slug("industrial-precision-multimeter")
                .vendor(vendor)
                .basePrice(BigDecimal.valueOf(1499.00))
                .sku("APX-MM-BASE")
                .status(ProductStatus.ACTIVE)
                .build();

        variant = ProductVariant.builder()
                .id(variantId)
                .product(product)
                .variantSku("APX-MM-01")
                .variantName("Standard Calibration")
                .price(BigDecimal.valueOf(1499.00))
                .active(true)
                .build();

        cart = Cart.builder()
                .id(UUID.randomUUID())
                .user(user)
                .build();
    }

    @Test
    @DisplayName("Should return empty cart when no cart exists")
    void shouldReturnEmptyCart() {
        when(cartRepository.findByUserId(userId)).thenReturn(Optional.empty());

        CartResponseDto result = cartService.getCart(userId, null);

        assertThat(result).isNotNull();
        assertThat(result.getItems()).isEmpty();
        assertThat(result.getTotalItems()).isEqualTo(0);
        assertThat(result.getGrandTotal()).isEqualTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("Should add new item to user cart successfully")
    void shouldAddItemToCart() {
        AddToCartRequest request = AddToCartRequest.builder()
                .variantId(variantId)
                .quantity(2)
                .build();

        when(productVariantRepository.findById(variantId)).thenReturn(Optional.of(variant));
        when(warehouseStockRepository.sumAvailableStockByProductAndVariant(productId, variantId)).thenReturn(50);
        when(cartRepository.findByUserId(userId)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartIdAndVariantId(cart.getId(), variantId)).thenReturn(Optional.empty());

        CartItem savedItem = CartItem.builder()
                .id(UUID.randomUUID())
                .cart(cart)
                .product(product)
                .variant(variant)
                .quantity(2)
                .build();

        when(cartItemRepository.findByCartId(cart.getId())).thenReturn(List.of(savedItem));

        CartResponseDto result = cartService.addItem(userId, request);

        assertThat(result).isNotNull();
        assertThat(result.getItems()).hasSize(1);
        assertThat(result.getTotalItems()).isEqualTo(2);
        assertThat(result.getVendorGroups()).hasSize(1);
        verify(cartItemRepository, times(1)).save(any(CartItem.class));
    }

    @Test
    @DisplayName("Should remove item when quantity updated to zero")
    void shouldRemoveItemOnZeroQuantity() {
        UUID cartItemId = UUID.randomUUID();
        UpdateCartItemRequest request = UpdateCartItemRequest.builder().quantity(0).build();

        CartItem item = CartItem.builder()
                .id(cartItemId)
                .cart(cart)
                .product(product)
                .variant(variant)
                .quantity(2)
                .build();

        when(cartRepository.findByUserId(userId)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findById(cartItemId)).thenReturn(Optional.of(item));
        when(cartItemRepository.findByCartId(cart.getId())).thenReturn(Collections.emptyList());

        CartResponseDto result = cartService.updateItemQuantity(userId, null, cartItemId, request);

        assertThat(result).isNotNull();
        assertThat(result.getItems()).isEmpty();
        verify(cartItemRepository, times(1)).delete(item);
    }

    @Test
    @DisplayName("Should merge guest cart items into authenticated user cart")
    void shouldMergeGuestCart() {
        String guestSession = "guest-xyz";
        Cart guestCart = Cart.builder()
                .id(UUID.randomUUID())
                .sessionId(guestSession)
                .build();

        CartItem guestItem = CartItem.builder()
                .id(UUID.randomUUID())
                .cart(guestCart)
                .product(product)
                .variant(variant)
                .quantity(3)
                .build();

        when(cartRepository.findBySessionId(guestSession)).thenReturn(Optional.of(guestCart));
        when(cartItemRepository.findByCartId(guestCart.getId())).thenReturn(List.of(guestItem));
        when(cartRepository.findByUserId(userId)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartIdAndVariantId(cart.getId(), variantId)).thenReturn(Optional.empty());

        CartItem mergedUserItem = CartItem.builder()
                .id(UUID.randomUUID())
                .cart(cart)
                .product(product)
                .variant(variant)
                .quantity(3)
                .build();

        when(cartItemRepository.findByCartId(cart.getId())).thenReturn(List.of(mergedUserItem));
        when(warehouseStockRepository.sumAvailableStockByProductAndVariant(productId, variantId)).thenReturn(20);

        CartResponseDto result = cartService.mergeGuestCart(userId, guestSession);

        assertThat(result).isNotNull();
        assertThat(result.getItems()).hasSize(1);
        assertThat(result.getTotalItems()).isEqualTo(3);
        verify(cartRepository, times(1)).delete(guestCart);
    }
}
