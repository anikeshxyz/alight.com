package com.alight.marketplace.modules.returns.dto;

import com.alight.marketplace.modules.returns.entity.ItemCondition;
import com.alight.marketplace.modules.returns.entity.RestockAction;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RmaItemDto {
    private UUID id;
    private UUID orderItemId;
    private UUID productId;
    private String productTitle;
    private String sku;
    private String imageUrl;
    private UUID variantId;
    private String variantName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal taxAmount;
    private BigDecimal refundAmount;
    private ItemCondition conditionOnReturn;
    private RestockAction restockAction;
    private UUID warehouseId;
    private String warehouseName;
    private String inspectedBy;
    private String inspectionNotes;
    private Instant inspectedAt;
}
