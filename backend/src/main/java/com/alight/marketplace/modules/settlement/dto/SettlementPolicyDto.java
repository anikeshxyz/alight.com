package com.alight.marketplace.modules.settlement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettlementPolicyDto {
    private UUID id;
    private String policyName;
    private String scope;
    private UUID scopeId;
    private Integer returnWindowDays;
    private Boolean autoApprovalEnabled;
    private Boolean holdDisputedOrders;
    private Integer coolingPeriodHours;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;
}
