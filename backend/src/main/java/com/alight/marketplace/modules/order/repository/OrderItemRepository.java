package com.alight.marketplace.modules.order.repository;

import com.alight.marketplace.modules.order.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {
    List<OrderItem> findByVendorOrderId(UUID vendorOrderId);

    @Query("SELECT COUNT(oi) > 0 FROM OrderItem oi WHERE oi.product.id = :productId AND oi.vendorOrder.masterOrder.user.id = :userId")
    boolean hasUserPurchasedProduct(@Param("productId") UUID productId, @Param("userId") UUID userId);
}
