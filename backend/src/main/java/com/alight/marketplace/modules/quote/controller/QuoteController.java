package com.alight.marketplace.modules.quote.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.quote.dto.CreateQuoteRequest;
import com.alight.marketplace.modules.quote.dto.QuoteDto;
import com.alight.marketplace.modules.quote.dto.QuoteOfferRequest;
import com.alight.marketplace.modules.quote.entity.QuoteStatus;
import com.alight.marketplace.modules.quote.service.QuoteService;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/quotes")
@RequiredArgsConstructor
@Tag(name = "B2B Quotes & RFQ", description = "B2B custom quotation and bulk price negotiation system")
public class QuoteController {

    private final QuoteService quoteService;
    private final UserRepository userRepository;

    @PostMapping
    @Operation(summary = "Submit RFQ", description = "Creates a new quotation request from buyer to vendor")
    public ResponseEntity<ApiResponse<QuoteDto>> createQuote(
            @Valid @RequestBody CreateQuoteRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = resolveUserId(userDetails);
        if (userId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Authentication required to submit RFQ"));
        }
        QuoteDto quote = quoteService.createQuoteRequest(userId, request);
        return ResponseEntity.ok(ApiResponse.success(quote, "Quotation request submitted successfully"));
    }

    @GetMapping("/my-quotes")
    @Operation(summary = "Get buyer RFQ history", description = "Paginated list of quote requests submitted by the authenticated buyer")
    public ResponseEntity<ApiResponse<Page<QuoteDto>>> getMyQuotes(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        UUID userId = resolveUserId(userDetails);
        if (userId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Authentication required"));
        }
        Page<QuoteDto> quotes = quoteService.getBuyerQuotes(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(quotes));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get quote request by ID", description = "Retrieves quote details with line item negotiations")
    public ResponseEntity<ApiResponse<QuoteDto>> getQuoteById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = resolveUserId(userDetails);
        if (userId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Authentication required"));
        }
        QuoteDto quote = quoteService.getQuoteById(id, userId);
        return ResponseEntity.ok(ApiResponse.success(quote));
    }

    @PostMapping("/{id}/accept")
    @Operation(summary = "Accept quote offer", description = "Buyer accepts seller's counter-offer for checkout")
    public ResponseEntity<ApiResponse<QuoteDto>> acceptQuote(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = resolveUserId(userDetails);
        if (userId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Authentication required"));
        }
        QuoteDto quote = quoteService.acceptQuoteOffer(userId, id);
        return ResponseEntity.ok(ApiResponse.success(quote, "Quote offer accepted"));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject quote", description = "Declines the RFQ or counter-offer")
    public ResponseEntity<ApiResponse<QuoteDto>> rejectQuote(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = resolveUserId(userDetails);
        if (userId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Authentication required"));
        }
        QuoteDto quote = quoteService.rejectQuote(userId, id, reason);
        return ResponseEntity.ok(ApiResponse.success(quote, "Quote rejected"));
    }

    // --- Vendor RFQ Endpoints ---

    @GetMapping("/vendor")
    @PreAuthorize("hasAnyRole('VENDOR', 'ADMIN')")
    @Operation(summary = "Get vendor incoming RFQs", description = "Paginated list of buyer quote requests received by vendor")
    public ResponseEntity<ApiResponse<Page<QuoteDto>>> getVendorQuotes(
            @RequestParam(required = false) QuoteStatus status,
            @PageableDefault(size = 10) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = resolveUserId(userDetails);
        Page<QuoteDto> quotes = quoteService.getVendorQuotes(userId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(quotes));
    }

    @PostMapping("/vendor/{id}/offer")
    @PreAuthorize("hasAnyRole('VENDOR', 'ADMIN')")
    @Operation(summary = "Submit counter-offer for RFQ", description = "Vendor sets custom pricing, shipping, and validity date for buyer RFQ")
    public ResponseEntity<ApiResponse<QuoteDto>> submitVendorOffer(
            @PathVariable UUID id,
            @Valid @RequestBody QuoteOfferRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = resolveUserId(userDetails);
        QuoteDto quote = quoteService.submitVendorOffer(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success(quote, "Quotation offer submitted to buyer"));
    }

    private UUID resolveUserId(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByEmail(userDetails.getUsername())
                .map(User::getId)
                .orElse(null);
    }
}
