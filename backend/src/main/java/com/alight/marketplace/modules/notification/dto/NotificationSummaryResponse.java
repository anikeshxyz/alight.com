package com.alight.marketplace.modules.notification.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationSummaryResponse {

    private long unreadCount;
    private List<NotificationResponse> recentNotifications;
}
