package com.alight.marketplace.modules.returns.dto;

import com.alight.marketplace.modules.returns.entity.ReturnReason;
import com.alight.marketplace.modules.returns.entity.ReturnType;
import com.alight.marketplace.modules.returns.entity.RmaStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RmaResponseDto {
    private UUID id;
    private String rmaNumber;
    private UUID orderId;
    private String orderNumber;
    private UUID vendorOrderId;
    private String subOrderNumber;
    private UUID userId;
    private String customerEmail;
    private String customerName;
    private UUID vendorId;
    private String vendorStoreName;
    private RmaStatus status;
    private ReturnType returnType;
    private ReturnReason reason;
    private String customerComments;
    private String proofImages;
    private String vendorNotes;
    private String adminNotes;
    private BigDecimal refundAmount;
    private BigDecimal restockFee;
    private BigDecimal netRefundAmount;
    private String reverseAwbNumber;
    private String reverseCarrierCode;
    private Instant pickupScheduledDate;
    private Instant receivedAt;
    private Instant completedAt;
    private List<RmaItemDto> items;
    private List<RmaEventDto> events;
    private Instant createdAt;
    private Instant updatedAt;
}
