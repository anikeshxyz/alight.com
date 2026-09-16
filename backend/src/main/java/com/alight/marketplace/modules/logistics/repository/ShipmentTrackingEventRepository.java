package com.alight.marketplace.modules.logistics.repository;

import com.alight.marketplace.modules.logistics.entity.ShipmentTrackingEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ShipmentTrackingEventRepository extends JpaRepository<ShipmentTrackingEvent, UUID> {
    List<ShipmentTrackingEvent> findByShipmentIdOrderByEventTimestampAsc(UUID shipmentId);
}
