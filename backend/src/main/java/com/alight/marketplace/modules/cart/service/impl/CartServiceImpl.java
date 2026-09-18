package com.alight.marketplace.modules.cart.service.impl;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.cart.dto.*;
import com.alight.marketplace.modules.cart.entity.Cart;
import com.alight.marketplace.modules.cart.entity.CartItem;
import com.alight.marketplace.modules.cart.repository.CartItemRepository;
import com.alight.marketplace.modules.cart.repository.CartRepository;
import com.alight.marketplace.modules.cart.service.CartService;
import com.alight.marketplace.modules.inventory.repository.WarehouseStockRepository;
import com.alight.marketplace.modules.pricing.dto.PriceCalculationRequest;
import com.alight.marketplace.modules.pricing.dto.PriceCalculationResponse;
import com.alight.marketplace.modules.pricing.service.PricingService;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.entity.ProductImage;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import com.alight.marketplace.modules.product.entity.ProductVariant;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.product.repository.ProductVariantRepository;
import com.alight.marketplace.modules.tax.dto.TaxCalculationRequest;
import com.alight.marketplace.modules.tax.dto.TaxCalculationResponse;
import com.alight.marketplace.modules.tax.service.TaxCalculationService;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final WarehouseStockRepository warehouseStockRepository;
    private final PricingService pricingService;
    private final TaxCalculationService taxCalculationService;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public CartResponseDto getCart(UUID userId, String guestSessionId) {
        Cart cart = resolveCart(userId, guestSessionId, false);
        if (cart == null) {
            return emptyCartResponse(userId, guestSessionId);
        }
        return buildCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponseDto addItem(UUID userId, AddToCartRequest request) {
        ProductVariant variant = productVariantRepository.findById(request.getVariantId())
                .orElseThrow(() -> new ResourceNotFoundException("Product variant not found: " + request.getVariantId()));

        Product product = variant.getProduct();
        if (product == null || product.getStatus() != ProductStatus.ACTIVE) {
            throw new BadRequestException("Product is not currently active for purchase");
        }

        int availableStock = calculateAvailableStock(product, variant);
        if (availableStock <= 0) {
            throw new BadRequestException("Product variant is currently out of stock");
        }

        Cart cart = resolveCart(userId, request.getGuestSessionId(), true);

        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndVariantId(cart.getId(), variant.getId());
        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            if (existingItem.isSavedForLater()) {
                existingItem.setSavedForLater(false);
                existingItem.setQuantity(request.getQuantity());
            } else {
                int newQuantity = existingItem.getQuantity() + request.getQuantity();
                if (newQuantity > availableStock) {
                    throw new BadRequestException("Requested quantity (" + newQuantity + ") exceeds available stock (" + availableStock + ")");
                }
                existingItem.setQuantity(newQuantity);
            }
            existingItem.setPriceAtAddition(variant.getPrice());
            cartItemRepository.save(existingItem);
        } else {
            if (request.getQuantity() > availableStock) {
                throw new BadRequestException("Requested quantity (" + request.getQuantity() + ") exceeds available stock (" + availableStock + ")");
            }
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .variant(variant)
                    .vendor(product.getVendor())
                    .quantity(request.getQuantity())
                    .priceAtAddition(variant.getPrice())
                    .savedForLater(false)
                    .build();
            cartItemRepository.save(newItem);
        }

        cart.setUpdatedAt(Instant.now());
        cartRepository.save(cart);

        return buildCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponseDto updateItemQuantity(UUID userId, String guestSessionId, UUID cartItemId, UpdateCartItemRequest request) {
        Cart cart = resolveCart(userId, guestSessionId, false);
        if (cart == null) {
            throw new ResourceNotFoundException("Cart not found");
        }

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found: " + cartItemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Cart item does not belong to this cart session");
        }

        if (request.getQuantity() <= 0) {
            cart.getItems().removeIf(i -> i.getId().equals(cartItemId));
            cartItemRepository.delete(item);
        } else {
            int availableStock = calculateAvailableStock(item.getProduct(), item.getVariant());
            if (availableStock <= 0) {
                throw new BadRequestException("Item '" + item.getProduct().getTitle() + "' is currently out of stock");
            }
            if (request.getQuantity() > availableStock) {
                throw new BadRequestException("Requested quantity (" + request.getQuantity() + ") exceeds available stock (" + availableStock + ")");
            }
            item.setQuantity(request.getQuantity());
            cartItemRepository.save(item);
        }

        cart.setUpdatedAt(Instant.now());
        cartRepository.save(cart);

        return buildCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponseDto removeItem(UUID userId, String guestSessionId, UUID cartItemId) {
        Cart cart = resolveCart(userId, guestSessionId, false);
        if (cart == null) {
            throw new ResourceNotFoundException("Cart not found");
        }

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found: " + cartItemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Cart item does not belong to this cart session");
        }

        cart.getItems().removeIf(i -> i.getId().equals(cartItemId));
        cartItemRepository.delete(item);
        cart.setUpdatedAt(Instant.now());
        cartRepository.save(cart);

        return buildCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponseDto clearCart(UUID userId, String guestSessionId) {
        Cart cart = resolveCart(userId, guestSessionId, false);
        if (cart != null) {
            cart.getItems().clear();
            cart.setUpdatedAt(Instant.now());
            cartRepository.save(cart);
        }
        return emptyCartResponse(userId, guestSessionId);
    }

    @Override
    @Transactional
    public CartResponseDto moveToSavedForLater(UUID userId, String guestSessionId, UUID cartItemId) {
        Cart cart = resolveCart(userId, guestSessionId, false);
        if (cart == null) {
            throw new ResourceNotFoundException("Cart not found");
        }

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found: " + cartItemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Cart item does not belong to this cart session");
        }

        item.setSavedForLater(true);
        cartItemRepository.save(item);

        cart.setUpdatedAt(Instant.now());
        cartRepository.save(cart);

        log.info("Moved cart item {} to saved-for-later in cart {}", cartItemId, cart.getId());
        return buildCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponseDto moveToCart(UUID userId, String guestSessionId, UUID cartItemId) {
        Cart cart = resolveCart(userId, guestSessionId, false);
        if (cart == null) {
            throw new ResourceNotFoundException("Cart not found");
        }

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found: " + cartItemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Cart item does not belong to this cart session");
        }

        int availableStock = calculateAvailableStock(item.getProduct(), item.getVariant());
        if (availableStock <= 0) {
            throw new BadRequestException("Cannot move item back to cart: item is out of stock");
        }

        item.setSavedForLater(false);
        cartItemRepository.save(item);

        cart.setUpdatedAt(Instant.now());
        cartRepository.save(cart);

        log.info("Moved saved item {} back to active cart in cart {}", cartItemId, cart.getId());
        return buildCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponseDto mergeGuestCart(UUID userId, String guestSessionId) {
        if (userId == null || guestSessionId == null || guestSessionId.isBlank()) {
            return getCart(userId, guestSessionId);
        }

        Optional<Cart> guestCartOpt = cartRepository.findBySessionId(guestSessionId);
        if (guestCartOpt.isEmpty()) {
            return getCart(userId, null);
        }

        Cart guestCart = guestCartOpt.get();
        List<CartItem> guestItems = cartItemRepository.findByCartId(guestCart.getId());
        if (guestItems.isEmpty()) {
            cartRepository.delete(guestCart);
            return getCart(userId, null);
        }

        User user = userRepository.findById(userId).orElse(null);
        Cart userCart = cartRepository.findByUserId(userId).orElseGet(() -> {
            Cart nc = Cart.builder()
                    .user(user)
                    .build();
            return cartRepository.save(nc);
        });

        for (CartItem gi : guestItems) {
            Optional<CartItem> userItemOpt = cartItemRepository.findByCartIdAndVariantId(userCart.getId(), gi.getVariant().getId());
            if (userItemOpt.isPresent()) {
                CartItem ui = userItemOpt.get();
                ui.setQuantity(ui.getQuantity() + gi.getQuantity());
                if (gi.isSavedForLater()) {
                    ui.setSavedForLater(gi.isSavedForLater());
                }
                cartItemRepository.save(ui);
            } else {
                CartItem ui = CartItem.builder()
                        .cart(userCart)
                        .product(gi.getProduct())
                        .variant(gi.getVariant())
                        .vendor(gi.getVendor())
                        .quantity(gi.getQuantity())
                        .priceAtAddition(gi.getPriceAtAddition())
                        .savedForLater(gi.isSavedForLater())
                        .build();
                cartItemRepository.save(ui);
            }
        }

        cartItemRepository.deleteByCartId(guestCart.getId());
        cartRepository.delete(guestCart);

        userCart.setUpdatedAt(Instant.now());
        cartRepository.save(userCart);

        return buildCartResponse(userCart);
    }

    private Cart resolveCart(UUID userId, String guestSessionId, boolean createIfAbsent) {
        if (userId != null) {
            Optional<Cart> opt = cartRepository.findByUserId(userId);
            if (opt.isPresent()) {
                return opt.get();
            }
            if (createIfAbsent) {
                User user = userRepository.findById(userId).orElse(null);
                Cart c = Cart.builder()
                        .user(user)
                        .build();
                return cartRepository.save(c);
            }
            return null;
        }

        if (guestSessionId != null && !guestSessionId.isBlank()) {
            Optional<Cart> opt = cartRepository.findBySessionId(guestSessionId);
            if (opt.isPresent()) {
                return opt.get();
            }
            if (createIfAbsent) {
                Cart c = Cart.builder()
                        .sessionId(guestSessionId)
                        .build();
                return cartRepository.save(c);
            }
            return null;
        }

        if (createIfAbsent) {
            String newGuestSessionId = UUID.randomUUID().toString();
            Cart c = Cart.builder()
                    .sessionId(newGuestSessionId)
                    .build();
            return cartRepository.save(c);
        }

        return null;
    }

    private CartResponseDto buildCartResponse(Cart cart) {
        List<CartItem> allItems = cartItemRepository.findByCartId(cart.getId());
        if (allItems.isEmpty()) {
            UUID uId = cart.getUser() != null ? cart.getUser().getId() : null;
            return emptyCartResponse(uId, cart.getSessionId());
        }

        List<CartItem> activeItems = allItems.stream().filter(i -> !i.isSavedForLater()).toList();
        List<CartItem> savedItems = allItems.stream().filter(CartItem::isSavedForLater).toList();

        List<CartItemDto> activeItemDtos = new ArrayList<>();
        Map<UUID, List<CartItemDto>> vendorGroupsMap = new LinkedHashMap<>();
        Map<UUID, Vendor> vendorMap = new HashMap<>();

        for (CartItem item : activeItems) {
            CartItemDto itemDto = mapToCartItemDto(item, false);
            activeItemDtos.add(itemDto);

            Vendor vendor = item.getProduct().getVendor();
            UUID vId = (vendor != null) ? vendor.getId() : UUID.fromString("00000000-0000-0000-0000-000000000000");
            vendorGroupsMap.computeIfAbsent(vId, k -> new ArrayList<>()).add(itemDto);
            if (vendor != null) {
                vendorMap.put(vendor.getId(), vendor);
            }
        }

        List<CartItemDto> savedItemDtos = savedItems.stream()
                .map(item -> mapToCartItemDto(item, true))
                .toList();

        List<VendorCartGroupDto> vendorGroups = new ArrayList<>();
        BigDecimal totalSubtotal = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        BigDecimal totalShipping = BigDecimal.ZERO;

        for (Map.Entry<UUID, List<CartItemDto>> entry : vendorGroupsMap.entrySet()) {
            UUID vId = entry.getKey();
            List<CartItemDto> gItems = entry.getValue();
            Vendor vp = vendorMap.get(vId);

            BigDecimal gSubtotal = gItems.stream().map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2, RoundingMode.HALF_UP);
            BigDecimal gDiscount = gItems.stream().map(CartItemDto::getLineDiscount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2, RoundingMode.HALF_UP);
            BigDecimal gTax = gItems.stream().map(CartItemDto::getLineTax)
                    .reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2, RoundingMode.HALF_UP);

            BigDecimal gShipping = gSubtotal.compareTo(BigDecimal.valueOf(10000)) >= 0 ? BigDecimal.ZERO : BigDecimal.valueOf(150.00);
            BigDecimal gTotal = gSubtotal.add(gTax).add(gShipping).setScale(2, RoundingMode.HALF_UP);
            int gTotalQty = gItems.stream().mapToInt(CartItemDto::getQuantity).sum();

            vendorGroups.add(VendorCartGroupDto.builder()
                    .vendorId(vId)
                    .storeName(vp != null ? vp.getStoreName() : (gItems.get(0).getVendorStoreName()))
                    .storeSlug(vp != null ? vp.getSlug() : "seller")
                    .items(gItems)
                    .groupSubtotal(gSubtotal)
                    .groupDiscount(gDiscount)
                    .groupTax(gTax)
                    .groupShipping(gShipping)
                    .groupTotal(gTotal)
                    .totalItems(gTotalQty)
                    .build());

            totalSubtotal = totalSubtotal.add(gSubtotal);
            totalDiscount = totalDiscount.add(gDiscount);
            totalTax = totalTax.add(gTax);
            totalShipping = totalShipping.add(gShipping);
        }

        int totalItemsCount = activeItemDtos.stream().mapToInt(CartItemDto::getQuantity).sum();
        BigDecimal grandTotal = totalSubtotal.add(totalTax).add(totalShipping).setScale(2, RoundingMode.HALF_UP);

        UUID uId = cart.getUser() != null ? cart.getUser().getId() : null;

        return CartResponseDto.builder()
                .cartId(cart.getId())
                .userId(uId)
                .guestSessionId(cart.getSessionId())
                .items(activeItemDtos)
                .savedForLaterItems(savedItemDtos)
                .vendorGroups(vendorGroups)
                .totalItems(totalItemsCount)
                .uniqueItems(activeItemDtos.size())
                .savedForLaterCount(savedItemDtos.size())
                .subtotalAmount(totalSubtotal)
                .discountAmount(totalDiscount)
                .estimatedTaxAmount(totalTax)
                .estimatedShippingAmount(totalShipping)
                .grandTotal(grandTotal)
                .currency("INR")
                .build();
    }

    private CartItemDto mapToCartItemDto(CartItem item, boolean isSaved) {
        Product product = item.getProduct();
        ProductVariant variant = item.getVariant();
        Vendor vendor = product != null ? product.getVendor() : null;

        int availableStock = calculateAvailableStock(product, variant);

        BigDecimal regularPrice = variant != null ? variant.getPrice() : BigDecimal.ZERO;
        BigDecimal effectiveUnitPrice = regularPrice;
        BigDecimal discount = BigDecimal.ZERO;

        try {
            if (variant != null) {
                PriceCalculationResponse priceRes = pricingService.calculatePrice(
                        PriceCalculationRequest.builder()
                                .productId(product != null ? product.getId() : null)
                                .variantId(variant.getId())
                                .quantity(item.getQuantity())
                                .build()
                );
                if (priceRes != null && priceRes.getEffectiveUnitPrice() != null) {
                    effectiveUnitPrice = priceRes.getEffectiveUnitPrice();
                    if (regularPrice.compareTo(effectiveUnitPrice) > 0) {
                        discount = regularPrice.subtract(effectiveUnitPrice).multiply(BigDecimal.valueOf(item.getQuantity()));
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Using standard unit price for item {}: {}", item.getId(), e.getMessage());
        }

        BigDecimal lineSubtotal = effectiveUnitPrice.multiply(BigDecimal.valueOf(item.getQuantity())).setScale(2, RoundingMode.HALF_UP);
        BigDecimal lineTax = BigDecimal.ZERO;
        BigDecimal taxRate = BigDecimal.valueOf(18.00);

        try {
            TaxCalculationResponse taxRes = taxCalculationService.calculateTax(
                    TaxCalculationRequest.builder()
                            .unitPrice(effectiveUnitPrice)
                            .quantity(item.getQuantity())
                            .originState("Maharashtra")
                            .destinationState("Maharashtra")
                            .hsnSacCode("8517")
                            .build()
            );
            if (taxRes != null && taxRes.getTotalTaxAmount() != null) {
                lineTax = taxRes.getTotalTaxAmount();
                if (taxRes.getTotalTaxRatePercent() != null) {
                    taxRate = taxRes.getTotalTaxRatePercent();
                }
            }
        } catch (Exception e) {
            log.debug("Tax estimation fallback for item {}: {}", item.getId(), e.getMessage());
            lineTax = lineSubtotal.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }

        String primaryImage = null;
        if (product != null && product.getImages() != null && !product.getImages().isEmpty()) {
            primaryImage = product.getImages().stream()
                    .filter(ProductImage::isPrimary)
                    .findFirst()
                    .map(ProductImage::getImageUrl)
                    .orElse(product.getImages().get(0).getImageUrl());
        }

        boolean priceChanged = item.getPriceAtAddition() != null &&
                effectiveUnitPrice.compareTo(item.getPriceAtAddition()) != 0;

        return CartItemDto.builder()
                .id(item.getId())
                .variantId(variant != null ? variant.getId() : null)
                .productId(product != null ? product.getId() : null)
                .productTitle(product != null ? product.getTitle() : "Product")
                .productSlug(product != null ? product.getSlug() : "product")
                .variantSku(variant != null ? variant.getVariantSku() : "")
                .variantName(variant != null ? variant.getVariantName() : "")
                .primaryImageUrl(primaryImage)
                .vendorId(vendor != null ? vendor.getId() : null)
                .vendorStoreName(vendor != null ? vendor.getStoreName() : "Marketplace Seller")
                .quantity(item.getQuantity())
                .unitPrice(effectiveUnitPrice)
                .regularPrice(regularPrice)
                .priceAtAddition(item.getPriceAtAddition())
                .priceChanged(priceChanged)
                .savedForLater(isSaved)
                .lineTotal(lineSubtotal.add(lineTax))
                .lineTax(lineTax)
                .lineDiscount(discount)
                .availableStock(availableStock)
                .hsnCode("8517")
                .taxRate(taxRate)
                .minOrderQuantity(1)
                .build();
    }

    private int calculateAvailableStock(Product product, ProductVariant variant) {
        if (product == null) {
            return 0;
        }
        if (product.getStatus() != ProductStatus.ACTIVE && product.getStatus() != ProductStatus.PENDING_APPROVAL) {
            return 0;
        }
        if (product.getStockQuantity() <= 0) {
            return 0;
        }
        if (variant != null && variant.getStockQuantity() <= 0 && product.getVariants() != null && product.getVariants().size() > 1) {
            return 0;
        }

        UUID variantId = variant != null ? variant.getId() : null;
        int warehouseAvailable;
        if (variantId != null && warehouseStockRepository.countByProductIdAndVariantId(product.getId(), variantId) > 0) {
            warehouseAvailable = warehouseStockRepository.sumAvailableStockByVariant(product.getId(), variantId);
        } else {
            warehouseAvailable = warehouseStockRepository.sumAvailableStockByProduct(product.getId());
        }

        if (warehouseAvailable > 0) {
            return warehouseAvailable;
        }

        int fallback = variant != null && variant.getStockQuantity() > 0 ? variant.getStockQuantity() : product.getStockQuantity();
        return Math.max(0, fallback);
    }

    private CartResponseDto emptyCartResponse(UUID userId, String guestSessionId) {
        return CartResponseDto.builder()
                .cartId(null)
                .userId(userId)
                .guestSessionId(guestSessionId)
                .items(Collections.emptyList())
                .savedForLaterItems(Collections.emptyList())
                .vendorGroups(Collections.emptyList())
                .totalItems(0)
                .uniqueItems(0)
                .savedForLaterCount(0)
                .subtotalAmount(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .estimatedTaxAmount(BigDecimal.ZERO)
                .estimatedShippingAmount(BigDecimal.ZERO)
                .grandTotal(BigDecimal.ZERO)
                .currency("INR")
                .build();
    }
}
