package com.alight.marketplace.modules.support.service;

import com.alight.marketplace.modules.notification.service.NotificationService;
import com.alight.marketplace.modules.order.repository.OrderRepository;
import com.alight.marketplace.modules.support.dto.AddTicketMessageRequest;
import com.alight.marketplace.modules.support.dto.CreateTicketRequest;
import com.alight.marketplace.modules.support.dto.TicketResponse;
import com.alight.marketplace.modules.support.entity.*;
import com.alight.marketplace.modules.support.repository.SupportTicketRepository;
import com.alight.marketplace.modules.support.repository.TicketMessageRepository;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SupportTicketServiceTest {

    @Mock
    private SupportTicketRepository ticketRepository;

    @Mock
    private TicketMessageRepository messageRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private VendorRepository vendorRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private SupportTicketServiceImpl supportTicketService;

    private User customer;
    private Vendor vendor;
    private UUID customerId;
    private UUID vendorId;

    @BeforeEach
    void setUp() {
        customerId = UUID.randomUUID();
        customer = new User();
        customer.setId(customerId);
        customer.setEmail("customer@test.com");
        customer.setFirstName("Alice");
        customer.setLastName("Smith");

        vendorId = UUID.randomUUID();
        vendor = new Vendor();
        vendor.setId(vendorId);
        vendor.setStoreName("Global Tech Distributors");
    }

    @Test
    @DisplayName("Should create support ticket and initial customer message successfully")
    void shouldCreateTicket() {
        CreateTicketRequest request = CreateTicketRequest.builder()
                .subject("Damaged item received")
                .category(TicketCategory.ORDER_ISSUE)
                .priority(TicketPriority.HIGH)
                .initialMessage("The screen on the unit is cracked.")
                .vendorId(vendorId)
                .build();

        when(userRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(vendor));
        when(ticketRepository.save(any(SupportTicket.class))).thenAnswer(inv -> {
            SupportTicket t = inv.getArgument(0);
            t.setId(UUID.randomUUID());
            t.setMessages(new ArrayList<>());
            return t;
        });
        when(messageRepository.save(any(TicketMessage.class))).thenAnswer(inv -> {
            TicketMessage m = inv.getArgument(0);
            m.setId(UUID.randomUUID());
            return m;
        });

        TicketResponse result = supportTicketService.createTicket(customerId, request);

        assertThat(result).isNotNull();
        assertThat(result.getSubject()).isEqualTo("Damaged item received");
        assertThat(result.getStatus()).isEqualTo(TicketStatus.OPEN);
        assertThat(result.getPriority()).isEqualTo(TicketPriority.HIGH);
        assertThat(result.getTicketNumber()).startsWith("TCK-");

        verify(ticketRepository).save(any(SupportTicket.class));
        verify(messageRepository).save(any(TicketMessage.class));
    }

    @Test
    @DisplayName("Should add customer reply message and update ticket status")
    void shouldAddCustomerReply() {
        UUID ticketId = UUID.randomUUID();
        SupportTicket ticket = SupportTicket.builder()
                .id(ticketId)
                .ticketNumber("TCK-2026-0001")
                .subject("Help needed")
                .status(TicketStatus.WAITING_ON_CUSTOMER)
                .priority(TicketPriority.MEDIUM)
                .category(TicketCategory.PRODUCT_INQUIRY)
                .user(customer)
                .messages(new ArrayList<>())
                .build();

        AddTicketMessageRequest msgReq = AddTicketMessageRequest.builder()
                .messageText("Here is the requested serial number: SN-998811.")
                .internalNote(false)
                .build();

        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));
        when(userRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(messageRepository.save(any(TicketMessage.class))).thenAnswer(inv -> {
            TicketMessage m = inv.getArgument(0);
            m.setId(UUID.randomUUID());
            return m;
        });
        when(ticketRepository.save(any(SupportTicket.class))).thenAnswer(inv -> inv.getArgument(0));

        TicketResponse result = supportTicketService.addMessage(ticketId, customerId, msgReq);

        assertThat(result).isNotNull();
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.IN_PROGRESS);

        verify(messageRepository).save(any(TicketMessage.class));
        verify(ticketRepository).save(ticket);
    }

    @Test
    @DisplayName("Should close support ticket")
    void shouldCloseTicket() {
        UUID ticketId = UUID.randomUUID();
        SupportTicket ticket = SupportTicket.builder()
                .id(ticketId)
                .ticketNumber("TCK-2026-0002")
                .subject("Refund question")
                .status(TicketStatus.IN_PROGRESS)
                .priority(TicketPriority.MEDIUM)
                .category(TicketCategory.RETURN_REFUND)
                .user(customer)
                .messages(new ArrayList<>())
                .build();

        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(SupportTicket.class))).thenAnswer(inv -> inv.getArgument(0));

        TicketResponse result = supportTicketService.closeTicket(ticketId, customerId);

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(TicketStatus.CLOSED);

        verify(ticketRepository).save(ticket);
    }
}
