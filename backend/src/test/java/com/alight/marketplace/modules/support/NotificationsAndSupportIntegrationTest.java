package com.alight.marketplace.modules.support;

import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.common.exception.UnauthorizedException;
import com.alight.marketplace.modules.auth.dto.RegisterRequest;
import com.alight.marketplace.modules.auth.service.AuthService;
import com.alight.marketplace.modules.notification.dto.NotificationResponse;
import com.alight.marketplace.modules.notification.dto.NotificationSummaryResponse;
import com.alight.marketplace.modules.notification.dto.SendBroadcastRequest;
import com.alight.marketplace.modules.notification.entity.NotificationChannel;
import com.alight.marketplace.modules.notification.entity.NotificationType;
import com.alight.marketplace.modules.notification.service.NotificationService;
import com.alight.marketplace.modules.support.dto.*;
import com.alight.marketplace.modules.support.entity.SenderType;
import com.alight.marketplace.modules.support.entity.TicketCategory;
import com.alight.marketplace.modules.support.entity.TicketPriority;
import com.alight.marketplace.modules.support.entity.TicketStatus;
import com.alight.marketplace.modules.support.service.SupportTicketService;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.dto.UpdateVendorStatusRequest;
import com.alight.marketplace.modules.vendor.dto.VendorApplicationRequest;
import com.alight.marketplace.modules.vendor.dto.VendorResponseDto;
import com.alight.marketplace.modules.vendor.entity.BusinessType;
import com.alight.marketplace.modules.vendor.entity.VendorStatus;
import com.alight.marketplace.modules.vendor.service.AdminVendorService;
import com.alight.marketplace.modules.vendor.service.VendorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
@Transactional
class NotificationsAndSupportIntegrationTest {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SupportTicketService supportTicketService;

    @Autowired
    private AuthService authService;

    @Autowired
    private VendorService vendorService;

    @Autowired
    private AdminVendorService adminVendorService;

    @Autowired
    private UserRepository userRepository;

    private User buyer1;
    private User buyer2;
    private User vendorUser;
    private User adminUser;
    private User supportAgent;
    private VendorResponseDto vendor;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String buyer1Email = "buyer1_support_" + suffix + "@alight.com";
        String buyer2Email = "buyer2_support_" + suffix + "@alight.com";
        String vendorEmail = "vendor_support_" + suffix + "@alight.com";
        String adminEmail = "admin_support_" + suffix + "@alight.com";
        String agentEmail = "agent_support_" + suffix + "@alight.com";

        authService.register(RegisterRequest.builder()
                .email(buyer1Email)
                .password("Password123!")
                .firstName("Customer")
                .lastName("One")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("CUSTOMER")
                .build());
        buyer1 = userRepository.findByEmail(buyer1Email).orElseThrow();

        authService.register(RegisterRequest.builder()
                .email(buyer2Email)
                .password("Password123!")
                .firstName("Customer")
                .lastName("Two")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("CUSTOMER")
                .build());
        buyer2 = userRepository.findByEmail(buyer2Email).orElseThrow();

        authService.register(RegisterRequest.builder()
                .email(vendorEmail)
                .password("Password123!")
                .firstName("Support")
                .lastName("Vendor")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("VENDOR")
                .build());
        vendorUser = userRepository.findByEmail(vendorEmail).orElseThrow();

        authService.register(RegisterRequest.builder()
                .email(adminEmail)
                .password("Password123!")
                .firstName("Platform")
                .lastName("Admin")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("ADMIN")
                .build());
        adminUser = userRepository.findByEmail(adminEmail).orElseThrow();

        authService.register(RegisterRequest.builder()
                .email(agentEmail)
                .password("Password123!")
                .firstName("Support")
                .lastName("Agent")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("ADMIN")
                .build());
        supportAgent = userRepository.findByEmail(agentEmail).orElseThrow();

        vendor = vendorService.applyAsVendor(vendorEmail, VendorApplicationRequest.builder()
                .storeName("Custom Leather Atelier " + suffix)
                .description("Handmade full-grain leather bags")
                .supportEmail(vendorEmail)
                .supportPhone("+15553334455")
                .legalBusinessName("Leather Atelier Pvt Ltd")
                .businessType(BusinessType.PRIVATE_LIMITED)
                .bankAccountNumber("987612345678")
                .bankIfscCode("HDFC0009876")
                .bankName("HDFC")
                .bankAccountHolderName("Leather Atelier Pvt Ltd")
                .pickupContactPerson("Master Craftsman")
                .pickupContactPhone("+15553334455")
                .pickupAddressLine1("Craft Workshop 8")
                .pickupCity("Kanpur")
                .pickupState("Uttar Pradesh")
                .pickupPostalCode("208001")
                .pickupCountry("India")
                .build());
        adminVendorService.updateVendorStatus(vendor.getId(), UpdateVendorStatusRequest.builder().status(VendorStatus.APPROVED).build());
    }

    @Test
    @DisplayName("Stage 18: Notification Center lifecycle - create, unread count, summary, and mark as read")
    void testNotificationCenterLifecycle() {
        // 1. Create notifications for Buyer 1
        NotificationResponse notif1 = notificationService.createNotification(
                buyer1.getId(),
                "Order Shipped",
                "Your package is on its way via Blue Dart.",
                NotificationType.ORDER_SHIPPED,
                NotificationChannel.IN_APP,
                "ORD-9988",
                "/orders/ORD-9988"
        );

        NotificationResponse notif2 = notificationService.createNotification(
                buyer1.getId(),
                "Payment Confirmed",
                "We received ₹4,500.00 for your order.",
                NotificationType.ORDER_CONFIRMED,
                NotificationChannel.IN_APP,
                "TXN-7766",
                "/orders/ORD-9988"
        );

        assertNotNull(notif1.getId());
        assertFalse(notif1.isRead());
        assertNotNull(notif2.getId());
        assertFalse(notif2.isRead());

        // 2. Check unread count
        long unreadCount = notificationService.getUnreadCount(buyer1.getId());
        assertEquals(2, unreadCount);

        // 3. Notification summary
        NotificationSummaryResponse summary = notificationService.getNotificationSummary(buyer1.getId());
        assertEquals(2, summary.getUnreadCount());
        assertEquals(2, summary.getRecentNotifications().size());

        // 4. Mark single notification as read
        NotificationResponse readNotif = notificationService.markAsRead(buyer1.getId(), notif1.getId());
        assertTrue(readNotif.isRead());
        assertNotNull(readNotif.getReadAt());
        assertEquals(1, notificationService.getUnreadCount(buyer1.getId()));

        // 5. Mark all as read
        notificationService.markAllAsRead(buyer1.getId());
        assertEquals(0, notificationService.getUnreadCount(buyer1.getId()));

        // 6. Security: Buyer 2 cannot mark Buyer 1's notification as read
        assertThrows(ResourceNotFoundException.class, () -> notificationService.markAsRead(buyer2.getId(), notif2.getId()));
    }

    @Test
    @DisplayName("Stage 18: Broadcast notification to platform users")
    void testBroadcastNotification() {
        notificationService.broadcastNotification(SendBroadcastRequest.builder()
                .title("Scheduled Platform Maintenance")
                .message("The platform will undergo scheduled maintenance on Sunday from 2AM to 4AM IST.")
                .actionUrl("/maintenance-info")
                .targetRole("ALL")
                .build());

        assertTrue(notificationService.getUnreadCount(buyer1.getId()) >= 1);
        assertTrue(notificationService.getUnreadCount(buyer2.getId()) >= 1);
        assertTrue(notificationService.getUnreadCount(vendorUser.getId()) >= 1);
    }

    @Test
    @DisplayName("Stage 18: Support ticket creation, automatic vendor notification, and message thread")
    void testSupportTicketCreationAndMessaging() {
        // 1. Customer creates a support ticket linked to a vendor
        CreateTicketRequest request = CreateTicketRequest.builder()
                .category(TicketCategory.PRODUCT_INQUIRY)
                .subject("Custom monogramming on leather messenger bag")
                .initialMessage("Hi, can you engrave initials 'AK' on the front flap?")
                .priority(TicketPriority.HIGH)
                .vendorId(vendor.getId())
                .attachments(List.of("https://storage.alight.com/attachments/sample_monogram.png"))
                .build();

        TicketResponse ticket = supportTicketService.createTicket(buyer1.getId(), request);

        assertNotNull(ticket);
        assertNotNull(ticket.getId());
        assertTrue(ticket.getTicketNumber().startsWith("TCK-"));
        assertEquals(TicketStatus.OPEN, ticket.getStatus());
        assertEquals(TicketPriority.HIGH, ticket.getPriority());
        assertEquals(1, ticket.getMessages().size());
        assertEquals("Hi, can you engrave initials 'AK' on the front flap?", ticket.getMessages().get(0).getMessageText());
        assertEquals(SenderType.CUSTOMER, ticket.getMessages().get(0).getSenderType());

        // Verify vendor received in-app notification
        long vendorUnread = notificationService.getUnreadCount(vendorUser.getId());
        assertTrue(vendorUnread >= 1);

        // 2. Vendor replies to ticket
        TicketResponse vendorReplied = supportTicketService.addMessage(ticket.getId(), vendorUser.getId(),
                AddTicketMessageRequest.builder()
                        .messageText("Yes! We offer complimentary laser monogramming. Please specify the font.")
                        .internalNote(false)
                        .build());

        assertEquals(TicketStatus.WAITING_ON_CUSTOMER, vendorReplied.getStatus());
        assertEquals(2, vendorReplied.getMessages().size());
        TicketMessageResponse lastMsg = vendorReplied.getMessages().get(1);
        assertEquals(SenderType.VENDOR, lastMsg.getSenderType());
        assertFalse(lastMsg.isInternalNote());

        // 3. Admin adds internal note (invisible to customer view)
        TicketResponse adminNoteTicket = supportTicketService.addMessage(ticket.getId(), adminUser.getId(),
                AddTicketMessageRequest.builder()
                        .messageText("Customer is a VIP tiered buyer, expedite workshop handling.")
                        .internalNote(true)
                        .build());

        assertEquals(3, adminNoteTicket.getMessages().size());

        // Verify that customer fetching ticket does NOT see the internal note
        TicketResponse customerView = supportTicketService.getTicketById(ticket.getId(), buyer1.getId(), false);
        assertEquals(2, customerView.getMessages().size()); // Only 2 public messages visible

        // Verify that admin fetching ticket DOES see the internal note
        TicketResponse adminView = supportTicketService.getTicketById(ticket.getId(), adminUser.getId(), true);
        assertEquals(3, adminView.getMessages().size());
    }

    @Test
    @DisplayName("Stage 18: Support ticket status transitions, resolution summary, and agent assignment")
    void testSupportTicketLifecycleAndAssignment() {
        CreateTicketRequest request = CreateTicketRequest.builder()
                .category(TicketCategory.ORDER_ISSUE)
                .subject("Package delayed in transit")
                .initialMessage("Shipment tracking has not updated for 3 days.")
                .priority(TicketPriority.URGENT)
                .build();

        TicketResponse ticket = supportTicketService.createTicket(buyer1.getId(), request);

        // 1. Admin assigns ticket to support agent
        TicketResponse assigned = supportTicketService.assignTicket(ticket.getId(), adminUser.getId(),
                AssignTicketRequest.builder().assignedToId(supportAgent.getId()).build());

        assertEquals(supportAgent.getId(), assigned.getAssignedToId());
        assertEquals("Support Agent", assigned.getAssignedToName());

        // 2. Update status to IN_PROGRESS
        TicketResponse inProgress = supportTicketService.updateTicketStatus(ticket.getId(), adminUser.getId(),
                UpdateTicketStatusRequest.builder()
                        .status(TicketStatus.IN_PROGRESS)
                        .build());
        assertEquals(TicketStatus.IN_PROGRESS, inProgress.getStatus());

        // 3. Resolve ticket with resolution summary
        TicketResponse resolved = supportTicketService.updateTicketStatus(ticket.getId(), adminUser.getId(),
                UpdateTicketStatusRequest.builder()
                        .status(TicketStatus.RESOLVED)
                        .resolutionSummary("Carrier escalated; package located and out for delivery today.")
                        .build());

        assertEquals(TicketStatus.RESOLVED, resolved.getStatus());
        assertNotNull(resolved.getResolvedAt());
        assertEquals("Carrier escalated; package located and out for delivery today.", resolved.getResolutionSummary());

        // 4. Customer closes the ticket
        TicketResponse closed = supportTicketService.closeTicket(ticket.getId(), buyer1.getId());
        assertEquals(TicketStatus.CLOSED, closed.getStatus());
    }

    @Test
    @DisplayName("Stage 18: Support ticket security isolation between customers and vendors")
    void testSupportTicketSecurityIsolation() {
        CreateTicketRequest request = CreateTicketRequest.builder()
                .category(TicketCategory.PAYMENT_FAILURE)
                .subject("Double charged for order")
                .initialMessage("Please check transaction TXN-999")
                .priority(TicketPriority.HIGH)
                .build();

        TicketResponse ticket = supportTicketService.createTicket(buyer1.getId(), request);

        // Buyer 2 cannot access Buyer 1's ticket
        assertThrows(UnauthorizedException.class, () -> supportTicketService.getTicketById(ticket.getId(), buyer2.getId(), false));
        assertThrows(UnauthorizedException.class, () -> supportTicketService.getTicketByNumber(ticket.getTicketNumber(), buyer2.getId(), false));

        // Buyer 2 cannot post message to Buyer 1's ticket
        assertThrows(UnauthorizedException.class, () -> supportTicketService.addMessage(ticket.getId(), buyer2.getId(),
                AddTicketMessageRequest.builder().messageText("Unauthorized message").build()));

        // Buyer 2 cannot close Buyer 1's ticket
        assertThrows(UnauthorizedException.class, () -> supportTicketService.closeTicket(ticket.getId(), buyer2.getId()));
    }

    @Test
    @DisplayName("Stage 18: Support ticket statistics aggregation")
    void testSupportTicketStatistics() {
        // Create an open urgent ticket
        supportTicketService.createTicket(buyer1.getId(), CreateTicketRequest.builder()
                .category(TicketCategory.TECHNICAL_SUPPORT)
                .subject("Urgent inquiry")
                .initialMessage("Urgent assistance required")
                .priority(TicketPriority.URGENT)
                .build());

        TicketStatsResponse stats = supportTicketService.getTicketStats();
        assertNotNull(stats);
        assertTrue(stats.getTotalTickets() >= 1);
        assertTrue(stats.getOpenTickets() >= 1);
        assertTrue(stats.getUrgentTickets() >= 1);
    }
}
