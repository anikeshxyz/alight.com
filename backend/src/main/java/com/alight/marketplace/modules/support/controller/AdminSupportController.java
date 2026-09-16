package com.alight.marketplace.modules.support.controller;

import com.alight.marketplace.common.exception.UnauthorizedException;
import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.support.dto.*;
import com.alight.marketplace.modules.support.entity.TicketCategory;
import com.alight.marketplace.modules.support.entity.TicketPriority;
import com.alight.marketplace.modules.support.entity.TicketStatus;
import com.alight.marketplace.modules.support.service.SupportTicketService;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/support/tickets")
@RequiredArgsConstructor
@Tag(name = "Admin Support Tickets", description = "Admin master workspace for platform support desk operations")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSupportController {

    private final SupportTicketService ticketService;
    private final UserRepository userRepository;

    @GetMapping
    @Operation(summary = "Search and filter all marketplace support tickets")
    public ResponseEntity<ApiResponse<Page<TicketResponse>>> getAllTickets(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) TicketPriority priority,
            @RequestParam(required = false) TicketCategory category,
            @PageableDefault(size = 20, sort = "updatedAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<TicketResponse> tickets = ticketService.getAdminTickets(status, priority, category, pageable);
        return ResponseEntity.ok(ApiResponse.success(tickets, "All support tickets retrieved successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get full ticket details including internal notes for admin")
    public ResponseEntity<ApiResponse<TicketResponse>> getTicket(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getUser(userDetails);
        TicketResponse ticket = ticketService.getTicketById(id, user.getId(), true);
        return ResponseEntity.ok(ApiResponse.success(ticket, "Support ticket retrieved successfully"));
    }

    @PostMapping("/{id}/messages")
    @Operation(summary = "Post reply or internal note by admin agent")
    public ResponseEntity<ApiResponse<TicketResponse>> addMessage(
            @PathVariable UUID id,
            @Valid @RequestBody AddTicketMessageRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getUser(userDetails);
        TicketResponse ticket = ticketService.addMessage(id, user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(ticket, "Message added successfully"));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update ticket status by admin")
    public ResponseEntity<ApiResponse<TicketResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTicketStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getUser(userDetails);
        TicketResponse ticket = ticketService.updateTicketStatus(id, user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(ticket, "Status updated successfully"));
    }

    @PostMapping("/{id}/assign")
    @Operation(summary = "Assign support ticket to an internal staff member")
    public ResponseEntity<ApiResponse<TicketResponse>> assignTicket(
            @PathVariable UUID id,
            @Valid @RequestBody AssignTicketRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getUser(userDetails);
        TicketResponse ticket = ticketService.assignTicket(id, user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(ticket, "Ticket assigned successfully"));
    }

    @PostMapping("/{id}/close")
    @Operation(summary = "Close support ticket")
    public ResponseEntity<ApiResponse<TicketResponse>> closeTicket(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getUser(userDetails);
        TicketResponse ticket = ticketService.closeTicket(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success(ticket, "Ticket closed successfully"));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get support ticket SLA and status statistics overview")
    public ResponseEntity<ApiResponse<TicketStatsResponse>> getSupportStats() {
        TicketStatsResponse stats = ticketService.getTicketStats();
        return ResponseEntity.ok(ApiResponse.success(stats, "Support statistics retrieved successfully"));
    }

    private User getUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new UnauthorizedException("User not found: " + userDetails.getUsername()));
    }
}
