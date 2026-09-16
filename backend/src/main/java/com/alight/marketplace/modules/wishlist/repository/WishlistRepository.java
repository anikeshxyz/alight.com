package com.alight.marketplace.modules.wishlist.repository;

import com.alight.marketplace.modules.wishlist.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, UUID> {
    Optional<Wishlist> findByUserId(UUID userId);
    Optional<Wishlist> findFirstByUserIdOrderByCreatedAtAsc(UUID userId);
    boolean existsByUserId(UUID userId);
}
