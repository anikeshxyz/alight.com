package com.alight.marketplace.modules.logistics.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrackingEventDto {
    private UUID id;
    private String eventStatus;
    private String locationHub;
    private String city;
    private String state;
    private String remarks;
    private String scannedBy;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Instant eventTimestamp;
}
