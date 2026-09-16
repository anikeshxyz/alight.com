package com.alight.marketplace.modules.support.controller;

import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.common.exception.UnauthorizedException;
import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.support.dto.AddTicketMessageRequest;
import com.alight.marketplace.modules.support.dto.CreateTicketRequest;
import com.alight.marketplace.modules.support.dto.TicketResponse;
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
@RequestMapping("/api/v1/support/tickets")
@RequiredArgsConstructor
@Tag(name = "Customer Support Tickets", description = "Customer endpoints for creating and tracking support cases and disputes")
public class CustomerSupportController {

    private final SupportTicketService ticketService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Create a new support ticket")
    public ResponseEntity<ApiResponse<TicketResponse>> createTicket(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateTicketRequest request
    ) {
        UUID userId = getUserId(userDetails);
        TicketResponse response = ticketService.createTicket(userId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Support ticket created successfully"));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List all tickets created by the authenticated user")
    public ResponseEntity<ApiResponse<Page<TicketResponse>>> getMyTickets(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        UUID userId = getUserId(userDetails);
        Page<TicketResponse> page = ticketService.getCustomerTickets(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(page, "Support tickets retrieved"));
    }

    @GetMapping("/{ticketNumber}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get full ticket details and threaded messages by ticket number")
    public ResponseEntity<ApiResponse<TicketResponse>> getTicket(
            @PathVariable String ticketNumber,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        TicketResponse response = ticketService.getTicketByNumber(ticketNumber, userId, false);
        return ResponseEntity.ok(ApiResponse.success(response, "Ticket details retrieved"));
    }

    @PostMapping("/{ticketId}/messages")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Post a reply message to a support ticket")
    public ResponseEntity<ApiResponse<TicketResponse>> addMessage(
            @PathVariable UUID ticketId,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AddTicketMessageRequest request
    ) {
        UUID userId = getUserId(userDetails);
        TicketResponse response = ticketService.addMessage(ticketId, userId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Message sent successfully"));
    }

    @PostMapping("/{ticketId}/close")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Customer marks ticket as closed / resolved")
    public ResponseEntity<ApiResponse<TicketResponse>> closeTicket(
            @PathVariable UUID ticketId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = getUserId(userDetails);
        TicketResponse response = ticketService.closeTicket(ticketId, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Ticket closed successfully"));
    }

    private UUID getUserId(UserDetails userDetails) {
        if (userDetails == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        return userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userDetails.getUsername()));
    }
}
