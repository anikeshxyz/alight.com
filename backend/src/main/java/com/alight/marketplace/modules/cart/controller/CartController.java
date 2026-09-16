package com.alight.marketplace.modules.cart.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.cart.dto.AddToCartRequest;
import com.alight.marketplace.modules.cart.dto.CartResponseDto;
import com.alight.marketplace.modules.cart.dto.MergeCartRequest;
import com.alight.marketplace.modules.cart.dto.UpdateCartItemRequest;
import com.alight.marketplace.modules.cart.service.CartService;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "Unified Shopping Cart & Saved-For-Later API for Guest & Authenticated Users")
public class CartController {

    private final CartService cartService;
    private final UserRepository userRepository;

    @GetMapping
    @Operation(summary = "Get active cart", description = "Retrieves the cart for the authenticated user or guest session, including saved-for-later items and multi-vendor groups")
    public ResponseEntity<ApiResponse<CartResponseDto>> getCart(
            @RequestParam(required = false) String guestSessionId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = resolveUserId(userDetails);
        CartResponseDto cart = cartService.getCart(userId, guestSessionId);
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @PostMapping("/items")
    @Operation(summary = "Add item to cart", description = "Adds a variant with specified quantity to the user or guest cart")
    public ResponseEntity<ApiResponse<CartResponseDto>> addItem(
            @Valid @RequestBody AddToCartRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = resolveUserId(userDetails);
        CartResponseDto cart = cartService.addItem(userId, request);
        return ResponseEntity.ok(ApiResponse.success(cart, "Item added to cart successfully"));
    }

    @PutMapping("/items/{cartItemId}")
    @Operation(summary = "Update cart item quantity", description = "Updates quantity or removes item if quantity is zero")
    public ResponseEntity<ApiResponse<CartResponseDto>> updateItem(
            @PathVariable UUID cartItemId,
            @RequestParam(required = false) String guestSessionId,
            @Valid @RequestBody UpdateCartItemRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = resolveUserId(userDetails);
        CartResponseDto cart = cartService.updateItemQuantity(userId, guestSessionId, cartItemId, request);
        return ResponseEntity.ok(ApiResponse.success(cart, "Cart item updated successfully"));
    }

    @DeleteMapping("/items/{cartItemId}")
    @Operation(summary = "Remove item from cart", description = "Deletes an item from the cart")
    public ResponseEntity<ApiResponse<CartResponseDto>> removeItem(
            @PathVariable UUID cartItemId,
            @RequestParam(required = false) String guestSessionId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = resolveUserId(userDetails);
        CartResponseDto cart = cartService.removeItem(userId, guestSessionId, cartItemId);
        return ResponseEntity.ok(ApiResponse.success(cart, "Item removed from cart"));
    }

    @PostMapping("/items/{cartItemId}/save-for-later")
    @Operation(summary = "Move item to saved-for-later", description = "Sets aside an item from the active cart to saved-for-later list")
    public ResponseEntity<ApiResponse<CartResponseDto>> moveToSavedForLater(
            @PathVariable UUID cartItemId,
            @RequestParam(required = false) String guestSessionId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = resolveUserId(userDetails);
        CartResponseDto cart = cartService.moveToSavedForLater(userId, guestSessionId, cartItemId);
        return ResponseEntity.ok(ApiResponse.success(cart, "Item moved to saved-for-later"));
    }

    @PostMapping("/items/{cartItemId}/move-to-cart")
    @Operation(summary = "Move item back to active cart", description = "Restores a saved-for-later item back into the active checkout cart")
    public ResponseEntity<ApiResponse<CartResponseDto>> moveToCart(
            @PathVariable UUID cartItemId,
            @RequestParam(required = false) String guestSessionId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = resolveUserId(userDetails);
        CartResponseDto cart = cartService.moveToCart(userId, guestSessionId, cartItemId);
        return ResponseEntity.ok(ApiResponse.success(cart, "Item moved back to active cart"));
    }

    @DeleteMapping
    @Operation(summary = "Clear cart", description = "Clears all items in the active cart session")
    public ResponseEntity<ApiResponse<CartResponseDto>> clearCart(
            @RequestParam(required = false) String guestSessionId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = resolveUserId(userDetails);
        CartResponseDto cart = cartService.clearCart(userId, guestSessionId);
        return ResponseEntity.ok(ApiResponse.success(cart, "Cart cleared successfully"));
    }

    @PostMapping("/merge")
    @Operation(summary = "Merge guest cart into user cart", description = "Transfers all items from guest session into authenticated user cart")
    public ResponseEntity<ApiResponse<CartResponseDto>> mergeCart(
            @Valid @RequestBody MergeCartRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = resolveUserId(userDetails);
        if (userId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Authentication required to merge cart"));
        }
        CartResponseDto cart = cartService.mergeGuestCart(userId, request.getGuestSessionId());
        return ResponseEntity.ok(ApiResponse.success(cart, "Guest cart merged successfully"));
    }

    private UUID resolveUserId(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElse(null);
    }
}
