package com.alight.marketplace.modules.settlement.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessPayoutRequest {
    private String utrNumber;
    private String adminNotes;
    private String rejectionReason;
}
