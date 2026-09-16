package com.alight.marketplace.modules.returns.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RmaStatsSummaryDto {
    private long totalRequests;
    private long pendingReview;
    private long inTransit;
    private long awaitingInspection;
    private long completedRefunded;
    private long rejected;
}
