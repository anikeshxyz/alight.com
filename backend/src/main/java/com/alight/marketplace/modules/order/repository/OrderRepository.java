package com.alight.marketplace.modules.order.repository;

import com.alight.marketplace.modules.order.entity.Order;
import com.alight.marketplace.modules.order.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {
    Optional<Order> findByOrderNumber(String orderNumber);
    Page<Order> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    Page<Order> findByUserIdAndOrderStatusOrderByCreatedAtDesc(UUID userId, OrderStatus orderStatus, Pageable pageable);
    Page<Order> findByOrderStatusOrderByCreatedAtDesc(OrderStatus orderStatus, Pageable pageable);
    long countByUserId(UUID userId);
    long countByUserIdAndOrderStatusIn(UUID userId, java.util.List<OrderStatus> statuses);
}
