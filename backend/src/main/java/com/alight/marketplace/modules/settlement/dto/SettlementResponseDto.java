package com.alight.marketplace.modules.settlement.dto;

import com.alight.marketplace.modules.settlement.entity.SettlementStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettlementResponseDto {
    private UUID id;
    private String settlementNumber;
    private UUID vendorId;
    private String vendorStoreName;
    private UUID masterOrderId;
    private String masterOrderNumber;
    private UUID vendorOrderId;
    private String subOrderNumber;
    private SettlementStatus status;
    private String holdReason;

    private BigDecimal grossAmount;
    private BigDecimal shippingCredit;
    private BigDecimal sellerCredits;
    private BigDecimal platformCommission;
    private BigDecimal logisticsDeduction;
    private BigDecimal paymentFeeDeduction;
    private BigDecimal marketplaceFee;
    private BigDecimal taxWithholdingAmount;
    private BigDecimal refundDeduction;
    private BigDecimal adjustmentAmount;
    private BigDecimal netPayableAmount;
    private String currencyCode;

    private String rateCardVersion;
    private String taxRuleVersion;
    private Instant eligibleAt;
    private Instant approvedAt;
    private Instant settledAt;
    private String calculationSnapshot;

    @Builder.Default
    private List<SettlementItemDto> items = new ArrayList<>();

    private Instant createdAt;
    private Instant updatedAt;
}
