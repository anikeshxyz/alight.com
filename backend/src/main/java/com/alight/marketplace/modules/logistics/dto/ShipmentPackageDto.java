package com.alight.marketplace.modules.logistics.dto;

import com.alight.marketplace.modules.logistics.entity.ShipmentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShipmentPackageDto {
    private UUID id;
    private String awbNumber;
    private UUID vendorOrderId;
    private String subOrderNumber;
    private UUID masterOrderId;
    private String masterOrderNumber;
    private UUID vendorId;
    private String vendorStoreName;
    private String carrierCode;
    private String carrierName;
    private ShipmentStatus status;
    private String shippingMode;
    private BigDecimal packageLengthCm;
    private BigDecimal packageWidthCm;
    private BigDecimal packageHeightCm;
    private BigDecimal deadWeightKg;
    private BigDecimal volumetricWeightKg;
    private BigDecimal billedWeightKg;
    private BigDecimal shippingCost;
    private String originPincode;
    private String originCity;
    private String originState;
    private String destinationPincode;
    private String destinationCity;
    private String destinationState;
    private String shippingLabelUrl;
    private String manifestId;
    private Instant pickupScheduledAt;
    private Instant pickedUpAt;
    private Instant estimatedDeliveryAt;
    private Instant deliveredAt;
    private String deliveryConfirmationCode;
    private Instant createdAt;
    private Instant updatedAt;
}
