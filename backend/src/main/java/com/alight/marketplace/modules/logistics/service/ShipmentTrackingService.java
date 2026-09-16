package com.alight.marketplace.modules.logistics.service;

import com.alight.marketplace.modules.logistics.dto.AddTrackingEventRequest;
import com.alight.marketplace.modules.logistics.dto.TrackingTimelineDto;

import java.util.UUID;

public interface ShipmentTrackingService {

    TrackingTimelineDto getTrackingTimelineByAwb(String awbNumber);

    TrackingTimelineDto getTrackingTimelineByOrderNumber(String orderNumber);

    TrackingTimelineDto addTrackingEvent(UUID shipmentId, AddTrackingEventRequest request);

    TrackingTimelineDto simulateNextCheckpoint(UUID shipmentId);

    void processCarrierWebhook(String carrierCode, String payload, String signature);
}
