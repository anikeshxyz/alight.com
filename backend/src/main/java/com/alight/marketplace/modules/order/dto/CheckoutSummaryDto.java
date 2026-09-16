package com.alight.marketplace.modules.order.dto;

import com.alight.marketplace.modules.cart.dto.VendorCartGroupDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutSummaryDto {
    private BigDecimal subtotalAmount;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal shippingAmount;
    private BigDecimal totalAmount;
    private Integer totalItems;
    private String reservationToken;
    private OffsetDateTime reservationExpiresAt;
    @Builder.Default
    private List<VendorCartGroupDto> vendorGroups = new ArrayList<>();
}
