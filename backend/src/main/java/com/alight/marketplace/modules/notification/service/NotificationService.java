package com.alight.marketplace.modules.notification.service;

import com.alight.marketplace.modules.notification.dto.NotificationResponse;
import com.alight.marketplace.modules.notification.dto.NotificationSummaryResponse;
import com.alight.marketplace.modules.notification.dto.SendBroadcastRequest;
import com.alight.marketplace.modules.notification.entity.NotificationChannel;
import com.alight.marketplace.modules.notification.entity.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface NotificationService {

    NotificationResponse createNotification(
            UUID userId,
            String title,
            String message,
            NotificationType type,
            NotificationChannel channel,
            String referenceId,
            String actionUrl
    );

    Page<NotificationResponse> getUserNotifications(UUID userId, Pageable pageable);

    NotificationSummaryResponse getNotificationSummary(UUID userId);

    long getUnreadCount(UUID userId);

    NotificationResponse markAsRead(UUID userId, UUID notificationId);

    void markAllAsRead(UUID userId);

    void broadcastNotification(SendBroadcastRequest request);
}
