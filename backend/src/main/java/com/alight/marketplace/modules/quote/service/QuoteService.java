package com.alight.marketplace.modules.quote.service;

import com.alight.marketplace.modules.quote.dto.CreateQuoteRequest;
import com.alight.marketplace.modules.quote.dto.QuoteDto;
import com.alight.marketplace.modules.quote.dto.QuoteOfferRequest;
import com.alight.marketplace.modules.quote.entity.QuoteStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface QuoteService {
    QuoteDto createQuoteRequest(UUID buyerId, CreateQuoteRequest request);
    Page<QuoteDto> getBuyerQuotes(UUID buyerId, Pageable pageable);
    Page<QuoteDto> getVendorQuotes(UUID vendorUserId, QuoteStatus status, Pageable pageable);
    QuoteDto getQuoteById(UUID quoteId, UUID requestingUserId);
    QuoteDto submitVendorOffer(UUID vendorUserId, UUID quoteId, QuoteOfferRequest request);
    QuoteDto acceptQuoteOffer(UUID buyerId, UUID quoteId);
    QuoteDto rejectQuote(UUID userId, UUID quoteId, String reason);
}
