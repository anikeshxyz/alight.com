package com.alight.marketplace.modules.logistics.dto;

import com.alight.marketplace.modules.logistics.entity.ShipmentStatus;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrackingTimelineDto {
    private String awbNumber;
    private UUID shipmentId;
    private String masterOrderNumber;
    private String subOrderNumber;
    private String carrierCode;
    private String carrierName;
    private ShipmentStatus currentStatus;
    private String originCity;
    private String destinationCity;
    private Instant estimatedDeliveryAt;
    private Instant deliveredAt;
    private String deliveryConfirmationCode;
    private String liveTrackingUrl;
    
    @Builder.Default
    private List<TrackingEventDto> events = new ArrayList<>();
}
