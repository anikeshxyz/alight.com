package com.alight.marketplace.modules.support.service;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.common.exception.UnauthorizedException;
import com.alight.marketplace.modules.notification.entity.NotificationChannel;
import com.alight.marketplace.modules.notification.entity.NotificationType;
import com.alight.marketplace.modules.notification.service.NotificationService;
import com.alight.marketplace.modules.order.entity.Order;
import com.alight.marketplace.modules.order.repository.OrderRepository;
import com.alight.marketplace.modules.support.dto.*;
import com.alight.marketplace.modules.support.entity.*;
import com.alight.marketplace.modules.support.repository.SupportTicketRepository;
import com.alight.marketplace.modules.support.repository.TicketMessageRepository;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupportTicketServiceImpl implements SupportTicketService {

    private final SupportTicketRepository ticketRepository;
    private final TicketMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public TicketResponse createTicket(UUID userId, CreateTicketRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Vendor vendor = null;
        if (request.getVendorId() != null) {
            vendor = vendorRepository.findById(request.getVendorId()).orElse(null);
        }

        Order order = null;
        if (request.getOrderId() != null) {
            order = orderRepository.findById(request.getOrderId()).orElse(null);
        }

        String ticketNumber = generateTicketNumber();

        SupportTicket ticket = SupportTicket.builder()
                .ticketNumber(ticketNumber)
                .user(user)
                .vendor(vendor)
                .order(order)
                .category(request.getCategory())
                .subject(request.getSubject())
                .priority(request.getPriority() != null ? request.getPriority() : TicketPriority.MEDIUM)
                .status(TicketStatus.OPEN)
                .build();

        ticket = ticketRepository.save(ticket);

        // Add initial message
        String customerName = user.getFirstName() + " " + (user.getLastName() != null ? user.getLastName() : "");
        TicketMessage initialMsg = TicketMessage.builder()
                .ticket(ticket)
                .sender(user)
                .senderType(SenderType.CUSTOMER)
                .senderName(customerName.trim() + " (Customer)")
                .messageText(request.getInitialMessage())
                .internalNote(false)
                .attachments(request.getAttachments() != null ? request.getAttachments() : new ArrayList<>())
                .build();

        messageRepository.save(initialMsg);
        ticket.getMessages().add(initialMsg);

        // Notify Vendor if assigned
        if (vendor != null && vendor.getUser() != null) {
            notificationService.createNotification(
                    vendor.getUser().getId(),
                    "New Support Ticket #" + ticketNumber,
                    "A customer opened a support ticket regarding " + request.getSubject(),
                    NotificationType.TICKET_MESSAGE,
                    NotificationChannel.IN_APP,
                    ticketNumber,
                    "/vendor/support"
            );
        }

        log.info("Created support ticket #{} for user {}", ticketNumber, user.getEmail());
        return TicketResponse.fromEntity(ticket, true);
    }

    @Override
    @Transactional(readOnly = true)
    public TicketResponse getTicketByNumber(String ticketNumber, UUID currentUserId, boolean isAdminOrVendor) {
        SupportTicket ticket = ticketRepository.findByTicketNumber(ticketNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with number: " + ticketNumber));

        validateTicketAccess(ticket, currentUserId, isAdminOrVendor);

        return TicketResponse.fromEntity(ticket, isAdminOrVendor);
    }

    @Override
    @Transactional(readOnly = true)
    public TicketResponse getTicketById(UUID ticketId, UUID currentUserId, boolean isAdminOrVendor) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));

        validateTicketAccess(ticket, currentUserId, isAdminOrVendor);

        return TicketResponse.fromEntity(ticket, isAdminOrVendor);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TicketResponse> getCustomerTickets(UUID userId, Pageable pageable) {
        return ticketRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(t -> TicketResponse.fromEntity(t, false));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TicketResponse> getVendorTickets(UUID vendorUserId, Pageable pageable) {
        Vendor vendor = vendorRepository.findByUserId(vendorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor profile not found for user: " + vendorUserId));

        return ticketRepository.findByVendorIdOrderByCreatedAtDesc(vendor.getId(), pageable)
                .map(t -> TicketResponse.fromEntity(t, true));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TicketResponse> getAdminTickets(TicketStatus status, TicketPriority priority, TicketCategory category, Pageable pageable) {
        if (status != null) {
            return ticketRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                    .map(t -> TicketResponse.fromEntity(t, true));
        }
        return ticketRepository.findAll(pageable)
                .map(t -> TicketResponse.fromEntity(t, true));
    }

    @Override
    @Transactional
    public TicketResponse addMessage(UUID ticketId, UUID senderUserId, AddTicketMessageRequest request) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + ticketId));

        User sender = userRepository.findById(senderUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender user not found: " + senderUserId));

        SenderType senderType = SenderType.CUSTOMER;
        String senderName = sender.getFirstName() + " " + (sender.getLastName() != null ? sender.getLastName() : "");
        senderName = senderName.trim();

        boolean isAdmin = sender.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));
        Optional<Vendor> vendorOpt = vendorRepository.findByUserId(senderUserId);

        if (isAdmin) {
            senderType = SenderType.ADMIN;
            senderName = "Alight Marketplace Support";
            if (ticket.getStatus() == TicketStatus.OPEN) {
                ticket.setStatus(TicketStatus.IN_PROGRESS);
            }
        } else if (vendorOpt.isPresent() && ticket.getVendor() != null && vendorOpt.get().getId().equals(ticket.getVendor().getId())) {
            senderType = SenderType.VENDOR;
            senderName = vendorOpt.get().getStoreName() + " (Vendor)";
            if (ticket.getStatus() == TicketStatus.OPEN || ticket.getStatus() == TicketStatus.WAITING_ON_VENDOR) {
                ticket.setStatus(TicketStatus.WAITING_ON_CUSTOMER);
            }
        } else if (sender.getId().equals(ticket.getUser().getId())) {
            senderType = SenderType.CUSTOMER;
            senderName = senderName + " (Customer)";
            if (ticket.getStatus() == TicketStatus.WAITING_ON_CUSTOMER) {
                ticket.setStatus(TicketStatus.IN_PROGRESS);
            }
        } else {
            throw new UnauthorizedException("You do not have permission to post messages to this ticket");
        }

        TicketMessage message = TicketMessage.builder()
                .ticket(ticket)
                .sender(sender)
                .senderType(senderType)
                .senderName(senderName)
                .messageText(request.getMessageText())
                .internalNote(request.isInternalNote() && (isAdmin || senderType == SenderType.VENDOR))
                .attachments(request.getAttachments() != null ? request.getAttachments() : new ArrayList<>())
                .build();

        messageRepository.save(message);
        ticket.getMessages().add(message);
        ticketRepository.save(ticket);

        // Notify counter-party if public message
        if (!message.isInternalNote()) {
            if (senderType == SenderType.CUSTOMER) {
                if (ticket.getVendor() != null && ticket.getVendor().getUser() != null) {
                    notificationService.createNotification(
                            ticket.getVendor().getUser().getId(),
                            "Customer Replied on #" + ticket.getTicketNumber(),
                            request.getMessageText(),
                            NotificationType.TICKET_MESSAGE,
                            NotificationChannel.IN_APP,
                            ticket.getTicketNumber(),
                            "/vendor/support"
                    );
                }
            } else {
                notificationService.createNotification(
                        ticket.getUser().getId(),
                        "Support Ticket Update #" + ticket.getTicketNumber(),
                        "New reply received on your support ticket: " + ticket.getSubject(),
                        NotificationType.TICKET_MESSAGE,
                        NotificationChannel.IN_APP,
                        ticket.getTicketNumber(),
                        "/support"
                );
            }
        }

        return TicketResponse.fromEntity(ticket, isAdmin || senderType == SenderType.VENDOR);
    }

    @Override
    @Transactional
    public TicketResponse updateTicketStatus(UUID ticketId, UUID userId, UpdateTicketStatusRequest request) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + ticketId));

        ticket.setStatus(request.getStatus());
        if (request.getStatus() == TicketStatus.RESOLVED || request.getStatus() == TicketStatus.CLOSED) {
            ticket.setResolvedAt(Instant.now());
            if (request.getResolutionSummary() != null) {
                ticket.setResolutionSummary(request.getResolutionSummary());
            }
        }

        ticket = ticketRepository.save(ticket);

        // Notify customer
        notificationService.createNotification(
                ticket.getUser().getId(),
                "Support Ticket Status Changed #" + ticket.getTicketNumber(),
                "Ticket has been updated to: " + request.getStatus().name(),
                NotificationType.TICKET_MESSAGE,
                NotificationChannel.IN_APP,
                ticket.getTicketNumber(),
                "/support"
        );

        return TicketResponse.fromEntity(ticket, true);
    }

    @Override
    @Transactional
    public TicketResponse assignTicket(UUID ticketId, UUID adminUserId, AssignTicketRequest request) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + ticketId));

        User assignee = userRepository.findById(request.getAssignedToId())
                .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found: " + request.getAssignedToId()));

        ticket.setAssignedTo(assignee);
        ticket = ticketRepository.save(ticket);

        return TicketResponse.fromEntity(ticket, true);
    }

    @Override
    @Transactional
    public TicketResponse closeTicket(UUID ticketId, UUID userId) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + ticketId));

        if (!ticket.getUser().getId().equals(userId)) {
            User user = userRepository.findById(userId).orElseThrow();
            boolean isAdmin = user.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));
            if (!isAdmin) {
                throw new UnauthorizedException("Cannot close ticket");
            }
        }

        ticket.setStatus(TicketStatus.CLOSED);
        ticket.setResolvedAt(Instant.now());
        ticket = ticketRepository.save(ticket);

        return TicketResponse.fromEntity(ticket, true);
    }

    @Override
    @Transactional(readOnly = true)
    public TicketStatsResponse getTicketStats() {
        List<SupportTicket> all = ticketRepository.findAll();

        long open = all.stream().filter(t -> t.getStatus() == TicketStatus.OPEN).count();
        long inProgress = all.stream().filter(t -> t.getStatus() == TicketStatus.IN_PROGRESS).count();
        long waiting = all.stream().filter(t -> t.getStatus() == TicketStatus.WAITING_ON_CUSTOMER || t.getStatus() == TicketStatus.WAITING_ON_VENDOR).count();
        long resolved = all.stream().filter(t -> t.getStatus() == TicketStatus.RESOLVED || t.getStatus() == TicketStatus.CLOSED).count();
        long urgent = all.stream().filter(t -> t.getPriority() == TicketPriority.URGENT && t.getStatus() != TicketStatus.CLOSED).count();

        return TicketStatsResponse.builder()
                .totalTickets(all.size())
                .openTickets(open)
                .inProgressTickets(inProgress)
                .waitingTickets(waiting)
                .resolvedTickets(resolved)
                .urgentTickets(urgent)
                .build();
    }

    private void validateTicketAccess(SupportTicket ticket, UUID userId, boolean isAdminOrVendor) {
        if (isAdminOrVendor) return;
        if (userId == null || !ticket.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("You do not have access to this support ticket");
        }
    }

    private String generateTicketNumber() {
        int year = Year.now().getValue();
        int randomNum = ThreadLocalRandom.current().nextInt(100000, 999999);
        return String.format("TCK-%d-%06d", year, randomNum);
    }
}
