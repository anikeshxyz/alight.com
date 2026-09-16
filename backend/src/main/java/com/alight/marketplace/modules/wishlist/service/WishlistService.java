package com.alight.marketplace.modules.wishlist.service;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.wishlist.dto.AddToWishlistRequest;
import com.alight.marketplace.modules.wishlist.dto.WishlistDto;
import com.alight.marketplace.modules.wishlist.dto.WishlistItemDto;
import com.alight.marketplace.modules.wishlist.entity.Wishlist;
import com.alight.marketplace.modules.wishlist.entity.WishlistItem;
import com.alight.marketplace.modules.wishlist.repository.WishlistItemRepository;
import com.alight.marketplace.modules.wishlist.repository.WishlistRepository;
import com.alight.marketplace.modules.product.mapper.ProductMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    @Transactional
    public WishlistDto getWishlist(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Wishlist wishlist = getOrCreateWishlist(user);

        return toWishlistDto(wishlist);
    }

    @Transactional
    public WishlistDto addToWishlist(UUID userId, AddToWishlistRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + request.getProductId()));

        Wishlist wishlist = getOrCreateWishlist(user);

        // Idempotent: if already in wishlist, just return current state
        if (wishlistItemRepository.existsByWishlistIdAndProductId(wishlist.getId(), product.getId())) {
            return toWishlistDto(wishlist);
        }

        WishlistItem item = WishlistItem.builder()
                .wishlist(wishlist)
                .product(product)
                .build();
        wishlistItemRepository.save(item);
        wishlist.getItems().add(item);
        log.info("Added product {} to wishlist {} for user {}", product.getId(), wishlist.getId(), userId);
        return toWishlistDto(wishlist);
    }

    @Transactional
    public WishlistDto removeFromWishlist(UUID userId, UUID productId) {
        Wishlist wishlist = wishlistRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wishlist not found for user: " + userId));

        wishlistItemRepository.deleteByWishlistIdAndProductId(wishlist.getId(), productId);
        wishlist.getItems().removeIf(item -> item.getProduct().getId().equals(productId));
        return toWishlistDto(wishlist);
    }

    @Transactional(readOnly = true)
    public boolean isInWishlist(UUID userId, UUID productId) {
        return wishlistRepository.findByUserId(userId)
                .map(w -> wishlistItemRepository.existsByWishlistIdAndProductId(w.getId(), productId))
                .orElse(false);
    }

    private synchronized Wishlist getOrCreateWishlist(User user) {
        return wishlistRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    try {
                        Wishlist wishlist = Wishlist.builder()
                                .user(user)
                                .name("My Wishlist")
                                .isPublic(false)
                                .build();
                        return wishlistRepository.save(wishlist);
                    } catch (Exception e) {
                        return wishlistRepository.findByUserId(user.getId())
                                .orElseThrow(() -> new BadRequestException("Failed to access wishlist"));
                    }
                });
    }

    private WishlistDto toWishlistDto(Wishlist wishlist) {
        List<WishlistItemDto> itemDtos = wishlist.getItems().stream()
                .map(item -> WishlistItemDto.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .product(productMapper.toSummaryDto(item.getProduct()))
                        .addedAt(item.getAddedAt())
                        .build())
                .collect(Collectors.toList());

        return WishlistDto.builder()
                .id(wishlist.getId())
                .name(wishlist.getName())
                .isPublic(wishlist.isPublic())
                .itemCount(itemDtos.size())
                .items(itemDtos)
                .createdAt(wishlist.getCreatedAt())
                .build();
    }
}
