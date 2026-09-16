package com.alight.marketplace.modules.order.repository;

import com.alight.marketplace.modules.order.entity.AddressType;
import com.alight.marketplace.modules.order.entity.OrderAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderAddressRepository extends JpaRepository<OrderAddress, UUID> {
    List<OrderAddress> findByOrderId(UUID orderId);
    Optional<OrderAddress> findByOrderIdAndAddressType(UUID orderId, AddressType addressType);
}
