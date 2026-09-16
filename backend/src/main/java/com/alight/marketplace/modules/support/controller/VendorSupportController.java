package com.alight.marketplace.modules.support.controller;

import com.alight.marketplace.common.exception.UnauthorizedException;
import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.support.dto.AddTicketMessageRequest;
import com.alight.marketplace.modules.support.dto.TicketResponse;
import com.alight.marketplace.modules.support.dto.UpdateTicketStatusRequest;
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
@RequestMapping("/api/v1/vendor/support/tickets")
@RequiredArgsConstructor
@Tag(name = "Vendor Support Tickets", description = "Vendor-specific customer support desk and communication APIs")
@PreAuthorize("hasRole('VENDOR') or hasRole('ADMIN')")
public class VendorSupportController {

    private final SupportTicketService ticketService;
    private final UserRepository userRepository;

    @GetMapping
    @Operation(summary = "Get vendor's support tickets with pagination")
    public ResponseEntity<ApiResponse<Page<TicketResponse>>> getVendorTickets(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 15, sort = "updatedAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        User user = getUser(userDetails);
        Page<TicketResponse> tickets = ticketService.getVendorTickets(user.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(tickets, "Vendor tickets retrieved successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get specific support ticket details for vendor")
    public ResponseEntity<ApiResponse<TicketResponse>> getTicket(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getUser(userDetails);
        TicketResponse ticket = ticketService.getTicketById(id, user.getId(), true);
        return ResponseEntity.ok(ApiResponse.success(ticket, "Ticket retrieved successfully"));
    }

    @PostMapping("/{id}/messages")
    @Operation(summary = "Post a message or internal note to ticket thread by vendor")
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
    @Operation(summary = "Update ticket status by vendor")
    public ResponseEntity<ApiResponse<TicketResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTicketStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getUser(userDetails);
        TicketResponse ticket = ticketService.updateTicketStatus(id, user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(ticket, "Status updated successfully"));
    }

    private User getUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new UnauthorizedException("User not found: " + userDetails.getUsername()));
    }
}
