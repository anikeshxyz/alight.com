package com.alight.marketplace.modules.notification.service;

import com.alight.marketplace.modules.notification.dto.NotificationResponse;
import com.alight.marketplace.modules.notification.dto.NotificationSummaryResponse;
import com.alight.marketplace.modules.notification.entity.Notification;
import com.alight.marketplace.modules.notification.entity.NotificationChannel;
import com.alight.marketplace.modules.notification.entity.NotificationType;
import com.alight.marketplace.modules.notification.repository.NotificationRepository;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private User testUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(userId);
        testUser.setEmail("test@alight.com");
        testUser.setFirstName("Test");
        testUser.setLastName("User");
    }

    @Test
    @DisplayName("Should create and save in-app notification successfully")
    void shouldCreateNotification() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification n = invocation.getArgument(0);
            n.setId(UUID.randomUUID());
            return n;
        });

        NotificationResponse result = notificationService.createNotification(
                userId,
                "Order Confirmed",
                "Your order #ORD-101 has been confirmed.",
                NotificationType.ORDER_CONFIRMED,
                NotificationChannel.IN_APP,
                "ORD-101",
                "/orders/ORD-101"
        );

        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo("Order Confirmed");
        assertThat(result.getType()).isEqualTo(NotificationType.ORDER_CONFIRMED);
        assertThat(result.isRead()).isFalse();

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertThat(saved.getUser().getId()).isEqualTo(userId);
        assertThat(saved.getMessage()).isEqualTo("Your order #ORD-101 has been confirmed.");
    }

    @Test
    @DisplayName("Should retrieve unread notification count")
    void shouldGetUnreadCount() {
        when(notificationRepository.countByUserIdAndReadFalse(userId)).thenReturn(5L);

        long count = notificationService.getUnreadCount(userId);

        assertThat(count).isEqualTo(5L);
        verify(notificationRepository).countByUserIdAndReadFalse(userId);
    }

    @Test
    @DisplayName("Should mark specific notification as read")
    void shouldMarkAsRead() {
        UUID notifId = UUID.randomUUID();
        Notification notification = Notification.builder()
                .id(notifId)
                .user(testUser)
                .title("Test Alert")
                .message("Test Message")
                .type(NotificationType.SYSTEM_BROADCAST)
                .channel(NotificationChannel.IN_APP)
                .read(false)
                .build();

        when(notificationRepository.findById(notifId)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NotificationResponse result = notificationService.markAsRead(userId, notifId);

        assertThat(result.isRead()).isTrue();
        assertThat(result.getReadAt()).isNotNull();
        verify(notificationRepository).save(notification);
    }

    @Test
    @DisplayName("Should mark all notifications as read for user")
    void shouldMarkAllAsRead() {
        when(notificationRepository.markAllAsReadForUser(eq(userId), any(java.time.Instant.class))).thenReturn(3);

        notificationService.markAllAsRead(userId);

        verify(notificationRepository).markAllAsReadForUser(eq(userId), any(java.time.Instant.class));
    }

    @Test
    @DisplayName("Should get notification summary with recent list and count")
    void shouldGetNotificationSummary() {
        when(notificationRepository.countByUserIdAndReadFalse(userId)).thenReturn(2L);
        Notification notification = Notification.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .title("Alert")
                .message("Msg")
                .type(NotificationType.ORDER_SHIPPED)
                .channel(NotificationChannel.IN_APP)
                .read(false)
                .build();
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq(userId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(notification)));

        NotificationSummaryResponse summary = notificationService.getNotificationSummary(userId);

        assertThat(summary.getUnreadCount()).isEqualTo(2L);
        assertThat(summary.getRecentNotifications()).hasSize(1);
    }
}
