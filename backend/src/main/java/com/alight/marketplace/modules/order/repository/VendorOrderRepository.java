package com.alight.marketplace.modules.order.repository;

import com.alight.marketplace.modules.order.entity.FulfillmentStatus;
import com.alight.marketplace.modules.order.entity.VendorOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VendorOrderRepository extends JpaRepository<VendorOrder, UUID> {
    Optional<VendorOrder> findBySubOrderNumber(String subOrderNumber);
    List<VendorOrder> findByMasterOrderId(UUID masterOrderId);
    List<VendorOrder> findByVendorId(UUID vendorId);
    long countByVendorId(UUID vendorId);
    Page<VendorOrder> findByVendorIdOrderByCreatedAtDesc(UUID vendorId, Pageable pageable);
    Page<VendorOrder> findByVendorIdAndFulfillmentStatusOrderByCreatedAtDesc(UUID vendorId, FulfillmentStatus fulfillmentStatus, Pageable pageable);
    List<VendorOrder> findByFulfillmentStatus(FulfillmentStatus fulfillmentStatus);
}
