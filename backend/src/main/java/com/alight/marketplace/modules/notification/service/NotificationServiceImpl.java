package com.alight.marketplace.modules.notification.service;

import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.notification.dto.NotificationResponse;
import com.alight.marketplace.modules.notification.dto.NotificationSummaryResponse;
import com.alight.marketplace.modules.notification.dto.SendBroadcastRequest;
import com.alight.marketplace.modules.notification.entity.Notification;
import com.alight.marketplace.modules.notification.entity.NotificationChannel;
import com.alight.marketplace.modules.notification.entity.NotificationType;
import com.alight.marketplace.modules.notification.repository.NotificationRepository;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public NotificationResponse createNotification(
            UUID userId,
            String title,
            String message,
            NotificationType type,
            NotificationChannel channel,
            String referenceId,
            String actionUrl
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .channel(channel != null ? channel : NotificationChannel.IN_APP)
                .referenceId(referenceId)
                .actionUrl(actionUrl)
                .read(false)
                .build();

        notification = notificationRepository.save(notification);
        log.info("Created in-app notification [{}] for user: {}", type, user.getEmail());

        return NotificationResponse.fromEntity(notification);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getUserNotifications(UUID userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(NotificationResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationSummaryResponse getNotificationSummary(UUID userId) {
        long unreadCount = notificationRepository.countByUserIdAndReadFalse(userId);
        Page<Notification> recentPage = notificationRepository.findByUserIdOrderByCreatedAtDesc(
                userId,
                PageRequest.of(0, 8)
        );

        List<NotificationResponse> list = recentPage.getContent().stream()
                .map(NotificationResponse::fromEntity)
                .collect(Collectors.toList());

        return NotificationSummaryResponse.builder()
                .unreadCount(unreadCount)
                .recentNotifications(list)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(UUID userId, UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));

        if (!notification.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Notification does not belong to user");
        }

        notification.setRead(true);
        notification.setReadAt(Instant.now());
        notification = notificationRepository.save(notification);

        return NotificationResponse.fromEntity(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllAsReadForUser(userId, Instant.now());
    }

    @Override
    @Transactional
    public void broadcastNotification(SendBroadcastRequest request) {
        List<User> users = userRepository.findAll();

        for (User u : users) {
            boolean targetMatch = true;
            if (request.getTargetRole() != null && !request.getTargetRole().equalsIgnoreCase("ALL")) {
                targetMatch = u.getRoles().stream()
                        .anyMatch(r -> r.getName().equalsIgnoreCase(request.getTargetRole()));
            }

            if (targetMatch) {
                Notification n = Notification.builder()
                        .user(u)
                        .title(request.getTitle())
                        .message(request.getMessage())
                        .type(NotificationType.SYSTEM_BROADCAST)
                        .channel(NotificationChannel.IN_APP)
                        .actionUrl(request.getActionUrl())
                        .read(false)
                        .build();
                notificationRepository.save(n);
            }
        }
    }
}
