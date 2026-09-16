package com.alight.marketplace.modules.logistics;

import com.alight.marketplace.modules.logistics.dto.AddTrackingEventRequest;
import com.alight.marketplace.modules.logistics.dto.TrackingTimelineDto;
import com.alight.marketplace.modules.logistics.entity.ShipmentPackage;
import com.alight.marketplace.modules.logistics.entity.ShipmentStatus;
import com.alight.marketplace.modules.logistics.entity.ShipmentTrackingEvent;
import com.alight.marketplace.modules.logistics.repository.ShipmentPackageRepository;
import com.alight.marketplace.modules.logistics.repository.ShipmentTrackingEventRepository;
import com.alight.marketplace.modules.logistics.service.impl.ShipmentTrackingServiceImpl;
import com.alight.marketplace.modules.order.entity.FulfillmentStatus;
import com.alight.marketplace.modules.order.entity.Order;
import com.alight.marketplace.modules.order.entity.OrderStatus;
import com.alight.marketplace.modules.order.entity.VendorOrder;
import com.alight.marketplace.modules.order.repository.OrderRepository;
import com.alight.marketplace.modules.order.repository.VendorOrderRepository;
import com.alight.marketplace.modules.settlement.service.SettlementService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShipmentTrackingServiceTest {

    @Mock
    private ShipmentPackageRepository shipmentRepository;
    @Mock
    private ShipmentTrackingEventRepository trackingEventRepository;
    @Mock
    private VendorOrderRepository vendorOrderRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private SettlementService settlementService;

    @InjectMocks
    private ShipmentTrackingServiceImpl trackingService;

    @Test
    @DisplayName("Add Tracking Checkpoint - Updates package, vendor order, and triggers escrow when DELIVERED")
    void testAddTrackingEventDeliveredTriggersEscrow() {
        UUID shipmentId = UUID.randomUUID();
        UUID vendorOrderId = UUID.randomUUID();

        Order masterOrder = Order.builder()
                .orderNumber("ORD-8888")
                .orderStatus(OrderStatus.CONFIRMED)
                .vendorOrders(new ArrayList<>())
                .build();
        masterOrder.setId(UUID.randomUUID());

        VendorOrder vendorOrder = VendorOrder.builder()
                .subOrderNumber("VORD-8888-1")
                .fulfillmentStatus(FulfillmentStatus.IN_TRANSIT)
                .masterOrder(masterOrder)
                .build();
        vendorOrder.setId(vendorOrderId);
        masterOrder.getVendorOrders().add(vendorOrder);

        ShipmentPackage pkg = ShipmentPackage.builder()
                .awbNumber("AWB-DELIV-999")
                .vendorOrder(vendorOrder)
                .masterOrder(masterOrder)
                .carrierCode("DELHIVERY")
                .carrierName("Delhivery Logistics")
                .status(ShipmentStatus.OUT_FOR_DELIVERY)
                .originCity("Mumbai")
                .originState("Maharashtra")
                .originPincode("400001")
                .destinationCity("New Delhi")
                .destinationState("Delhi")
                .destinationPincode("110001")
                .trackingEvents(new ArrayList<>())
                .build();
        pkg.setId(shipmentId);

        when(shipmentRepository.findById(shipmentId)).thenReturn(Optional.of(pkg));
        when(trackingEventRepository.save(any(ShipmentTrackingEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(trackingEventRepository.findByShipmentIdOrderByEventTimestampAsc(shipmentId)).thenReturn(new ArrayList<>());

        AddTrackingEventRequest request = AddTrackingEventRequest.builder()
                .eventStatus("DELIVERED")
                .locationHub("Customer Doorstep, New Delhi")
                .city("New Delhi")
                .state("Delhi")
                .remarks("Delivered and signed by recipient")
                .scannedBy("Delivery Agent")
                .build();

        TrackingTimelineDto result = trackingService.addTrackingEvent(shipmentId, request);

        assertThat(result).isNotNull();
        assertThat(pkg.getStatus()).isEqualTo(ShipmentStatus.DELIVERED);
        assertThat(vendorOrder.getFulfillmentStatus()).isEqualTo(FulfillmentStatus.DELIVERED);

        // Verify escrow release was automatically invoked!
        verify(settlementService, times(1)).releaseEscrow(vendorOrderId);
    }
}
