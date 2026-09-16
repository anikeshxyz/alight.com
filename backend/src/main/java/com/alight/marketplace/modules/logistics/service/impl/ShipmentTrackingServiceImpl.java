package com.alight.marketplace.modules.logistics.service.impl;

import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.logistics.dto.AddTrackingEventRequest;
import com.alight.marketplace.modules.logistics.dto.TrackingEventDto;
import com.alight.marketplace.modules.logistics.dto.TrackingTimelineDto;
import com.alight.marketplace.modules.logistics.entity.ShipmentPackage;
import com.alight.marketplace.modules.logistics.entity.ShipmentStatus;
import com.alight.marketplace.modules.logistics.entity.ShipmentTrackingEvent;
import com.alight.marketplace.modules.logistics.repository.ShipmentPackageRepository;
import com.alight.marketplace.modules.logistics.repository.ShipmentTrackingEventRepository;
import com.alight.marketplace.modules.logistics.service.ShipmentTrackingService;
import com.alight.marketplace.modules.order.entity.FulfillmentStatus;
import com.alight.marketplace.modules.order.entity.Order;
import com.alight.marketplace.modules.order.entity.OrderStatus;
import com.alight.marketplace.modules.order.entity.VendorOrder;
import com.alight.marketplace.modules.order.repository.OrderRepository;
import com.alight.marketplace.modules.order.repository.VendorOrderRepository;
import com.alight.marketplace.modules.settlement.service.SettlementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShipmentTrackingServiceImpl implements ShipmentTrackingService {

    private final ShipmentPackageRepository shipmentRepository;
    private final ShipmentTrackingEventRepository trackingEventRepository;
    private final VendorOrderRepository vendorOrderRepository;
    private final OrderRepository orderRepository;
    private final SettlementService settlementService;

    @Override
    @Transactional(readOnly = true)
    public TrackingTimelineDto getTrackingTimelineByAwb(String awbNumber) {
        ShipmentPackage shipment = shipmentRepository.findByAwbNumber(awbNumber.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found for AWB: " + awbNumber));
        return buildTimeline(shipment);
    }

    @Override
    @Transactional(readOnly = true)
    public TrackingTimelineDto getTrackingTimelineByOrderNumber(String orderNumber) {
        Order masterOrder = orderRepository.findByOrderNumber(orderNumber.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with number: " + orderNumber));

        List<ShipmentPackage> shipments = shipmentRepository.findByMasterOrderId(masterOrder.getId());
        if (shipments.isEmpty()) {
            throw new ResourceNotFoundException("No active shipments booked yet for order: " + orderNumber);
        }

        // Return primary shipment or most active
        ShipmentPackage shipment = shipments.get(0);
        return buildTimeline(shipment);
    }

    @Override
    @Transactional
    public TrackingTimelineDto addTrackingEvent(UUID shipmentId, AddTrackingEventRequest request) {
        ShipmentPackage shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found with ID: " + shipmentId));

        ShipmentTrackingEvent event = ShipmentTrackingEvent.builder()
                .shipment(shipment)
                .eventStatus(request.getEventStatus().toUpperCase())
                .locationHub(request.getLocationHub())
                .city(request.getCity())
                .state(request.getState())
                .remarks(request.getRemarks())
                .scannedBy(request.getScannedBy() != null ? request.getScannedBy() : "Checkpoint Agent")
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .eventTimestamp(Instant.now())
                .build();

        trackingEventRepository.save(event);

        // Update package & order status
        updateShipmentAndOrderStatus(shipment, request.getEventStatus().toUpperCase());

        return buildTimeline(shipment);
    }

    @Override
    @Transactional
    public TrackingTimelineDto simulateNextCheckpoint(UUID shipmentId) {
        ShipmentPackage shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found with ID: " + shipmentId));

        ShipmentStatus current = shipment.getStatus();
        String nextStatus;
        String hub;
        String remarks;

        switch (current) {
            case MANIFESTED:
                nextStatus = "PICKED_UP";
                hub = shipment.getOriginCity() + " Primary Fulfillment Hub";
                remarks = "Consignment handed over to " + shipment.getCarrierName() + " courier rider";
                shipment.setPickedUpAt(Instant.now());
                break;
            case PICKED_UP:
                nextStatus = "IN_TRANSIT";
                hub = "National Sorting Gateway (" + shipment.getOriginState() + ")";
                remarks = "Package in transit via line-haul express vehicle to destination hub";
                break;
            case IN_TRANSIT:
                nextStatus = "OUT_FOR_DELIVERY";
                hub = shipment.getDestinationCity() + " Last-Mile Delivery Facility";
                remarks = "Out for delivery with delivery executive (Delivery Code: " + shipment.getDeliveryConfirmationCode() + ")";
                break;
            case OUT_FOR_DELIVERY:
                nextStatus = "DELIVERED";
                hub = shipment.getDestinationCity() + " Doorstep Delivery";
                remarks = "Shipment successfully delivered to recipient. Signed & verified.";
                shipment.setDeliveredAt(Instant.now());
                break;
            default:
                nextStatus = current.name();
                hub = shipment.getDestinationCity() + " Hub";
                remarks = "Status verified as " + current.name();
                break;
        }

        ShipmentTrackingEvent event = ShipmentTrackingEvent.builder()
                .shipment(shipment)
                .eventStatus(nextStatus)
                .locationHub(hub)
                .city(nextStatus.equals("DELIVERED") || nextStatus.equals("OUT_FOR_DELIVERY") ? shipment.getDestinationCity() : shipment.getOriginCity())
                .state(nextStatus.equals("DELIVERED") || nextStatus.equals("OUT_FOR_DELIVERY") ? shipment.getDestinationState() : shipment.getOriginState())
                .remarks(remarks)
                .scannedBy("Simulated Courier Agent")
                .eventTimestamp(Instant.now())
                .build();

        trackingEventRepository.save(event);
        updateShipmentAndOrderStatus(shipment, nextStatus);

        return buildTimeline(shipment);
    }

    @Override
    @Transactional
    public void processCarrierWebhook(String carrierCode, String payload, String signature) {
        log.info("Processing webhook from carrier {}: payload length {}", carrierCode, payload != null ? payload.length() : 0);
        if (payload == null || payload.isBlank()) return;

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(payload);

            String awb = root.path("awbNumber").asText(root.path("awb").asText(root.path("tracking_number").asText(null)));
            String status = root.path("status").asText(root.path("event_status").asText(null));
            String location = root.path("location").asText(root.path("city").asText("Transit Hub"));
            String remarks = root.path("remarks").asText(root.path("message").asText("Carrier scan update"));

            if (awb != null && status != null) {
                shipmentRepository.findByAwbNumber(awb.trim()).ifPresent(shipment -> {
                    ShipmentTrackingEvent event = ShipmentTrackingEvent.builder()
                            .shipment(shipment)
                            .eventStatus(status.toUpperCase())
                            .locationHub(location)
                            .city(shipment.getDestinationCity())
                            .state(shipment.getDestinationState())
                            .remarks(remarks)
                            .scannedBy("Carrier Webhook [" + carrierCode + "]")
                            .eventTimestamp(Instant.now())
                            .build();

                    trackingEventRepository.save(event);
                    updateShipmentAndOrderStatus(shipment, status.toUpperCase());
                    log.info("Carrier webhook updated shipment {} with status {}", awb, status);
                });
            }
        } catch (Exception e) {
            log.error("Failed to parse carrier webhook payload for {}: {}", carrierCode, e.getMessage());
        }
    }

    private void updateShipmentAndOrderStatus(ShipmentPackage shipment, String eventStatus) {
        VendorOrder vo = shipment.getVendorOrder();

        switch (eventStatus) {
            case "PICKED_UP":
                shipment.setStatus(ShipmentStatus.PICKED_UP);
                vo.setFulfillmentStatus(FulfillmentStatus.SHIPPED);
                if (shipment.getPickedUpAt() == null) shipment.setPickedUpAt(Instant.now());
                break;
            case "REACHED_HUB":
            case "IN_TRANSIT":
                shipment.setStatus(ShipmentStatus.IN_TRANSIT);
                vo.setFulfillmentStatus(FulfillmentStatus.IN_TRANSIT);
                break;
            case "OUT_FOR_DELIVERY":
                shipment.setStatus(ShipmentStatus.OUT_FOR_DELIVERY);
                vo.setFulfillmentStatus(FulfillmentStatus.IN_TRANSIT);
                break;
            case "DELIVERED":
                shipment.setStatus(ShipmentStatus.DELIVERED);
                shipment.setDeliveredAt(Instant.now());
                vo.setFulfillmentStatus(FulfillmentStatus.DELIVERED);
                vo.setDeliveredAt(Instant.now());

                // Trigger automatic escrow release upon verified delivery
                try {
                    settlementService.releaseEscrow(vo.getId());
                    log.info("Successfully released escrow for delivered sub-order {}", vo.getSubOrderNumber());
                } catch (Exception e) {
                    log.error("Could not auto-release escrow for sub-order {}: {}", vo.getSubOrderNumber(), e.getMessage());
                }

                // Check if master order is fully delivered
                checkAndUpdateMasterOrderDelivery(vo.getMasterOrder());
                break;
            case "RTO_INITIATED":
                shipment.setStatus(ShipmentStatus.RTO_INITIATED);
                break;
            case "RTO_DELIVERED":
                shipment.setStatus(ShipmentStatus.RTO_DELIVERED);
                break;
            case "CANCELLED":
                shipment.setStatus(ShipmentStatus.CANCELLED);
                vo.setFulfillmentStatus(FulfillmentStatus.CANCELLED);
                break;
            default:
                break;
        }

        shipmentRepository.save(shipment);
        vendorOrderRepository.save(vo);
    }

    private void checkAndUpdateMasterOrderDelivery(Order masterOrder) {
        if (masterOrder == null) return;
        List<VendorOrder> subOrders = vendorOrderRepository.findByMasterOrderId(masterOrder.getId());
        boolean allDelivered = subOrders.stream()
                .allMatch(so -> so.getFulfillmentStatus() == FulfillmentStatus.DELIVERED);

        if (allDelivered) {
            masterOrder.setOrderStatus(OrderStatus.DELIVERED);
            orderRepository.save(masterOrder);
            log.info("Master order {} is now fully DELIVERED", masterOrder.getOrderNumber());
        }
    }

    private TrackingTimelineDto buildTimeline(ShipmentPackage shipment) {
        List<ShipmentTrackingEvent> events = trackingEventRepository.findByShipmentIdOrderByEventTimestampAsc(shipment.getId());

        List<TrackingEventDto> eventDtos = events.stream()
                .map(e -> TrackingEventDto.builder()
                        .id(e.getId())
                        .eventStatus(e.getEventStatus())
                        .locationHub(e.getLocationHub())
                        .city(e.getCity())
                        .state(e.getState())
                        .remarks(e.getRemarks())
                        .scannedBy(e.getScannedBy())
                        .latitude(e.getLatitude())
                        .longitude(e.getLongitude())
                        .eventTimestamp(e.getEventTimestamp())
                        .build())
                .collect(Collectors.toList());

        return TrackingTimelineDto.builder()
                .awbNumber(shipment.getAwbNumber())
                .shipmentId(shipment.getId())
                .masterOrderNumber(shipment.getMasterOrder().getOrderNumber())
                .subOrderNumber(shipment.getVendorOrder().getSubOrderNumber())
                .carrierCode(shipment.getCarrierCode())
                .carrierName(shipment.getCarrierName())
                .currentStatus(shipment.getStatus())
                .originCity(shipment.getOriginCity())
                .destinationCity(shipment.getDestinationCity())
                .estimatedDeliveryAt(shipment.getEstimatedDeliveryAt())
                .deliveredAt(shipment.getDeliveredAt())
                .deliveryConfirmationCode(shipment.getDeliveryConfirmationCode())
                .liveTrackingUrl("/track?awb=" + shipment.getAwbNumber())
                .events(eventDtos)
                .build();
    }
}
