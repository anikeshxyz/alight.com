package com.alight.marketplace.modules.support.dto;

import com.alight.marketplace.modules.support.entity.SupportTicket;
import com.alight.marketplace.modules.support.entity.TicketCategory;
import com.alight.marketplace.modules.support.entity.TicketPriority;
import com.alight.marketplace.modules.support.entity.TicketStatus;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketResponse {

    private UUID id;
    private String ticketNumber;
    private UUID userId;
    private String customerName;
    private String customerEmail;
    private UUID vendorId;
    private String vendorStoreName;
    private UUID orderId;
    private String orderNumber;
    private TicketCategory category;
    private String subject;
    private TicketStatus status;
    private TicketPriority priority;
    private UUID assignedToId;
    private String assignedToName;
    private String resolutionSummary;
    private Instant resolvedAt;
    private List<TicketMessageResponse> messages;
    private Instant createdAt;
    private Instant updatedAt;

    public static TicketResponse fromEntity(SupportTicket ticket) {
        return fromEntity(ticket, true);
    }

    public static TicketResponse fromEntity(SupportTicket ticket, boolean includeInternalNotes) {
        String customerName = "Customer";
        String customerEmail = null;
        if (ticket.getUser() != null) {
            customerName = ticket.getUser().getFirstName() + " " + (ticket.getUser().getLastName() != null ? ticket.getUser().getLastName() : "");
            customerName = customerName.trim();
            customerEmail = ticket.getUser().getEmail();
        }

        String assignedToName = null;
        if (ticket.getAssignedTo() != null) {
            assignedToName = ticket.getAssignedTo().getFirstName() + " " + (ticket.getAssignedTo().getLastName() != null ? ticket.getAssignedTo().getLastName() : "");
            assignedToName = assignedToName.trim();
        }

        List<TicketMessageResponse> messageList = new ArrayList<>();
        if (ticket.getMessages() != null) {
            messageList = ticket.getMessages().stream()
                    .filter(m -> includeInternalNotes || !m.isInternalNote())
                    .map(TicketMessageResponse::fromEntity)
                    .collect(Collectors.toList());
        }

        return TicketResponse.builder()
                .id(ticket.getId())
                .ticketNumber(ticket.getTicketNumber())
                .userId(ticket.getUser() != null ? ticket.getUser().getId() : null)
                .customerName(customerName)
                .customerEmail(customerEmail)
                .vendorId(ticket.getVendor() != null ? ticket.getVendor().getId() : null)
                .vendorStoreName(ticket.getVendor() != null ? ticket.getVendor().getStoreName() : null)
                .orderId(ticket.getOrder() != null ? ticket.getOrder().getId() : null)
                .orderNumber(ticket.getOrder() != null ? ticket.getOrder().getOrderNumber() : null)
                .category(ticket.getCategory())
                .subject(ticket.getSubject())
                .status(ticket.getStatus())
                .priority(ticket.getPriority())
                .assignedToId(ticket.getAssignedTo() != null ? ticket.getAssignedTo().getId() : null)
                .assignedToName(assignedToName)
                .resolutionSummary(ticket.getResolutionSummary())
                .resolvedAt(ticket.getResolvedAt())
                .messages(messageList)
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }
}
