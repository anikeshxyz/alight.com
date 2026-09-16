package com.alight.marketplace.modules.support.service;

import com.alight.marketplace.modules.support.dto.*;
import com.alight.marketplace.modules.support.entity.TicketCategory;
import com.alight.marketplace.modules.support.entity.TicketPriority;
import com.alight.marketplace.modules.support.entity.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface SupportTicketService {

    TicketResponse createTicket(UUID userId, CreateTicketRequest request);

    TicketResponse getTicketByNumber(String ticketNumber, UUID currentUserId, boolean isAdminOrVendor);

    TicketResponse getTicketById(UUID ticketId, UUID currentUserId, boolean isAdminOrVendor);

    Page<TicketResponse> getCustomerTickets(UUID userId, Pageable pageable);

    Page<TicketResponse> getVendorTickets(UUID vendorUserId, Pageable pageable);

    Page<TicketResponse> getAdminTickets(TicketStatus status, TicketPriority priority, TicketCategory category, Pageable pageable);

    TicketResponse addMessage(UUID ticketId, UUID senderUserId, AddTicketMessageRequest request);

    TicketResponse updateTicketStatus(UUID ticketId, UUID userId, UpdateTicketStatusRequest request);

    TicketResponse assignTicket(UUID ticketId, UUID adminUserId, AssignTicketRequest request);

    TicketResponse closeTicket(UUID ticketId, UUID userId);

    TicketStatsResponse getTicketStats();
}
