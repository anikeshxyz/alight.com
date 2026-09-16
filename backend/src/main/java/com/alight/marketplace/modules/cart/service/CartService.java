package com.alight.marketplace.modules.cart.service;

import com.alight.marketplace.modules.cart.dto.AddToCartRequest;
import com.alight.marketplace.modules.cart.dto.CartResponseDto;
import com.alight.marketplace.modules.cart.dto.UpdateCartItemRequest;

import java.util.UUID;

public interface CartService {
    CartResponseDto getCart(UUID userId, String guestSessionId);
    CartResponseDto addItem(UUID userId, AddToCartRequest request);
    CartResponseDto updateItemQuantity(UUID userId, String guestSessionId, UUID cartItemId, UpdateCartItemRequest request);
    CartResponseDto removeItem(UUID userId, String guestSessionId, UUID cartItemId);
    CartResponseDto clearCart(UUID userId, String guestSessionId);
    CartResponseDto mergeGuestCart(UUID userId, String guestSessionId);
    CartResponseDto moveToSavedForLater(UUID userId, String guestSessionId, UUID cartItemId);
    CartResponseDto moveToCart(UUID userId, String guestSessionId, UUID cartItemId);
}
