package com.alight.marketplace.modules.cart.repository;

import com.alight.marketplace.modules.cart.entity.Cart;
import com.alight.marketplace.modules.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartRepository extends JpaRepository<Cart, UUID> {
    Optional<Cart> findByUser(User user);
    Optional<Cart> findByUserId(UUID userId);
    Optional<Cart> findBySessionId(String sessionId);
}
