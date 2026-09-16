package com.alight.marketplace.modules.wishlist.controller;

import com.alight.marketplace.common.exception.UnauthorizedException;
import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.wishlist.dto.AddToWishlistRequest;
import com.alight.marketplace.modules.wishlist.dto.WishlistDto;
import com.alight.marketplace.modules.wishlist.service.WishlistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/wishlist")
@RequiredArgsConstructor
@Tag(name = "Wishlist", description = "Customer product wishlist management")
public class WishlistController {

    private final WishlistService wishlistService;
    private final UserRepository userRepository;

    private UUID getUserId(Principal principal) {
        if (principal == null) throw new UnauthorizedException("Authentication required");
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new UnauthorizedException("User not found"))
                .getId();
    }

    @GetMapping
    @Operation(summary = "Get customer wishlist", description = "Returns the authenticated customer's full wishlist with product details")
    public ResponseEntity<ApiResponse<WishlistDto>> getWishlist(Principal principal) {
        WishlistDto wishlist = wishlistService.getWishlist(getUserId(principal));
        return ResponseEntity.ok(ApiResponse.success(wishlist));
    }

    @PostMapping("/items")
    @Operation(summary = "Add product to wishlist", description = "Adds a product (optionally a specific variant) to the wishlist. Idempotent.")
    public ResponseEntity<ApiResponse<WishlistDto>> addToWishlist(
            Principal principal,
            @Valid @RequestBody AddToWishlistRequest request
    ) {
        WishlistDto wishlist = wishlistService.addToWishlist(getUserId(principal), request);
        return ResponseEntity.ok(ApiResponse.success(wishlist, "Added to wishlist"));
    }

    @DeleteMapping("/items/{productId}")
    @Operation(summary = "Remove product from wishlist")
    public ResponseEntity<ApiResponse<WishlistDto>> removeFromWishlist(
            Principal principal,
            @PathVariable UUID productId
    ) {
        WishlistDto wishlist = wishlistService.removeFromWishlist(getUserId(principal), productId);
        return ResponseEntity.ok(ApiResponse.success(wishlist, "Removed from wishlist"));
    }

    @GetMapping("/check")
    @Operation(summary = "Check if product is in wishlist", description = "Returns a boolean indicating if the product is already wishlisted")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkWishlist(
            Principal principal,
            @RequestParam UUID productId
    ) {
        boolean inWishlist = wishlistService.isInWishlist(getUserId(principal), productId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("inWishlist", inWishlist)));
    }
}
