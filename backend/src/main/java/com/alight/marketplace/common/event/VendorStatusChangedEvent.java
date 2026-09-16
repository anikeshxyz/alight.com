package com.alight.marketplace.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorStatusChangedEvent {
    private UUID vendorId;
    private String storeName;
    private String oldStatus;
    private String newStatus;
    private String rejectionReason;
    @Builder.Default
    private Instant timestamp = Instant.now();
}
