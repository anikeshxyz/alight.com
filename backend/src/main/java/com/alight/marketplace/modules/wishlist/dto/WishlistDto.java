package com.alight.marketplace.modules.wishlist.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistDto {
    private UUID id;
    private String name;
    private boolean isPublic;
    private int itemCount;
    private List<WishlistItemDto> items;
    private Instant createdAt;
}
