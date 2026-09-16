package com.alight.marketplace.modules.inventory.dto;

import com.alight.marketplace.modules.inventory.entity.ReservationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockReservationResponse {
    private UUID id;
    private String reservationToken;
    private UUID warehouseId;
    private String warehouseName;
    private UUID productId;
    private String productTitle;
    private UUID variantId;
    private String variantName;
    private int reservedQuantity;
    private ReservationStatus status;
    private Instant expiresAt;
    private Instant createdAt;
}
