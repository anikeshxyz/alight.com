package com.alight.marketplace.modules.quote.service.impl;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.common.exception.ForbiddenException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.entity.ProductImage;
import com.alight.marketplace.modules.product.entity.ProductVariant;
import com.alight.marketplace.modules.product.repository.ProductVariantRepository;
import com.alight.marketplace.modules.quote.dto.*;
import com.alight.marketplace.modules.quote.entity.QuoteItem;
import com.alight.marketplace.modules.quote.entity.QuoteRequest;
import com.alight.marketplace.modules.quote.entity.QuoteStatus;
import com.alight.marketplace.modules.quote.repository.QuoteItemRepository;
import com.alight.marketplace.modules.quote.repository.QuoteRequestRepository;
import com.alight.marketplace.modules.quote.service.QuoteService;
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

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.Year;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuoteServiceImpl implements QuoteService {

    private final QuoteRequestRepository quoteRequestRepository;
    private final QuoteItemRepository quoteItemRepository;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final ProductVariantRepository productVariantRepository;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    @Transactional
    public QuoteDto createQuoteRequest(UUID buyerId, CreateQuoteRequest request) {
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new ResourceNotFoundException("Buyer not found: " + buyerId));

        Vendor vendor = vendorRepository.findById(request.getVendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found: " + request.getVendorId()));

        String quoteNumber = generateQuoteNumber();

        QuoteRequest quote = QuoteRequest.builder()
                .quoteNumber(quoteNumber)
                .user(buyer)
                .vendor(vendor)
                .status(QuoteStatus.PENDING)
                .notes(request.getNotes())
                .targetPrice(BigDecimal.ZERO)
                .offeredPrice(BigDecimal.ZERO)
                .build();

        QuoteRequest savedQuote = quoteRequestRepository.save(quote);

        BigDecimal totalTarget = BigDecimal.ZERO;

        for (CreateQuoteItemDto itemDto : request.getItems()) {
            ProductVariant variant = productVariantRepository.findById(itemDto.getVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product variant not found: " + itemDto.getVariantId()));

            BigDecimal targetPrice = itemDto.getTargetUnitPrice() != null ? itemDto.getTargetUnitPrice() : variant.getPrice();

            QuoteItem item = QuoteItem.builder()
                    .quote(savedQuote)
                    .product(variant.getProduct())
                    .variant(variant)
                    .quantity(itemDto.getRequestedQuantity())
                    .requestedUnitPrice(targetPrice)
                    .offeredUnitPrice(null)
                    .build();

            quoteItemRepository.save(item);

            if (targetPrice != null) {
                totalTarget = totalTarget.add(targetPrice.multiply(BigDecimal.valueOf(itemDto.getRequestedQuantity())));
            }
        }

        savedQuote.setTargetPrice(totalTarget);
        quoteRequestRepository.save(savedQuote);

        return mapToQuoteDto(savedQuote);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<QuoteDto> getBuyerQuotes(UUID buyerId, Pageable pageable) {
        Page<QuoteRequest> quotes = quoteRequestRepository.findByUserIdOrderByCreatedAtDesc(buyerId, pageable);
        return quotes.map(this::mapToQuoteDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<QuoteDto> getVendorQuotes(UUID vendorUserId, QuoteStatus status, Pageable pageable) {
        Vendor vendor = vendorRepository.findByUserId(vendorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor profile not found for user: " + vendorUserId));

        Page<QuoteRequest> quotes;
        if (status != null) {
            quotes = quoteRequestRepository.findByVendorIdAndStatusOrderByCreatedAtDesc(vendor.getId(), status, pageable);
        } else {
            quotes = quoteRequestRepository.findByVendorIdOrderByCreatedAtDesc(vendor.getId(), pageable);
        }

        return quotes.map(this::mapToQuoteDto);
    }

    @Override
    @Transactional(readOnly = true)
    public QuoteDto getQuoteById(UUID quoteId, UUID requestingUserId) {
        QuoteRequest quote = quoteRequestRepository.findById(quoteId)
                .orElseThrow(() -> new ResourceNotFoundException("Quote request not found: " + quoteId));

        boolean isBuyer = quote.getUser().getId().equals(requestingUserId);
        boolean isVendor = quote.getVendor().getUser() != null && quote.getVendor().getUser().getId().equals(requestingUserId);

        if (!isBuyer && !isVendor) {
            throw new ForbiddenException("Access denied to quote: " + quote.getQuoteNumber());
        }

        return mapToQuoteDto(quote);
    }

    @Override
    @Transactional
    public QuoteDto submitVendorOffer(UUID vendorUserId, UUID quoteId, QuoteOfferRequest request) {
        Vendor vendor = vendorRepository.findByUserId(vendorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor profile not found for user: " + vendorUserId));

        QuoteRequest quote = quoteRequestRepository.findById(quoteId)
                .orElseThrow(() -> new ResourceNotFoundException("Quote request not found: " + quoteId));

        if (!quote.getVendor().getId().equals(vendor.getId())) {
            throw new ForbiddenException("You do not have permission to counter-offer this quote");
        }

        if (quote.getStatus() != QuoteStatus.PENDING && quote.getStatus() != QuoteStatus.OFFERED) {
            throw new BadRequestException("Cannot submit offer for quote in status: " + quote.getStatus());
        }

        List<QuoteItem> items = quoteItemRepository.findByQuoteId(quote.getId());
        Map<UUID, BigDecimal> offerMap = request.getItems().stream()
                .collect(Collectors.toMap(QuoteOfferItemDto::getQuoteItemId, QuoteOfferItemDto::getOfferedUnitPrice));

        BigDecimal totalOffered = BigDecimal.ZERO;

        for (QuoteItem item : items) {
            if (offerMap.containsKey(item.getId())) {
                BigDecimal offeredPrice = offerMap.get(item.getId());
                item.setOfferedUnitPrice(offeredPrice);
                quoteItemRepository.save(item);
                totalOffered = totalOffered.add(offeredPrice.multiply(BigDecimal.valueOf(item.getQuantity())));
            } else if (item.getOfferedUnitPrice() != null) {
                totalOffered = totalOffered.add(item.getOfferedUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            }
        }

        quote.setOfferedPrice(totalOffered);
        quote.setVendorNotes(request.getSellerNotes());
        if (request.getValidUntil() != null) {
            quote.setExpiresAt(request.getValidUntil().toInstant());
        }
        quote.setStatus(QuoteStatus.OFFERED);
        quote.setUpdatedAt(Instant.now());

        QuoteRequest saved = quoteRequestRepository.save(quote);
        return mapToQuoteDto(saved);
    }

    @Override
    @Transactional
    public QuoteDto acceptQuoteOffer(UUID buyerId, UUID quoteId) {
        QuoteRequest quote = quoteRequestRepository.findById(quoteId)
                .orElseThrow(() -> new ResourceNotFoundException("Quote request not found: " + quoteId));

        if (!quote.getUser().getId().equals(buyerId)) {
            throw new ForbiddenException("You do not have permission to accept this quote");
        }

        if (quote.getStatus() != QuoteStatus.OFFERED) {
            throw new BadRequestException("Quote must be in OFFERED status to accept");
        }

        if (quote.getExpiresAt() != null && Instant.now().isAfter(quote.getExpiresAt())) {
            quote.setStatus(QuoteStatus.EXPIRED);
            quoteRequestRepository.save(quote);
            throw new BadRequestException("This quote offer has expired and can no longer be accepted");
        }

        quote.setStatus(QuoteStatus.ACCEPTED);
        quote.setUpdatedAt(Instant.now());
        QuoteRequest saved = quoteRequestRepository.save(quote);

        return mapToQuoteDto(saved);
    }

    @Override
    @Transactional
    public QuoteDto rejectQuote(UUID userId, UUID quoteId, String reason) {
        QuoteRequest quote = quoteRequestRepository.findById(quoteId)
                .orElseThrow(() -> new ResourceNotFoundException("Quote request not found: " + quoteId));

        boolean isBuyer = quote.getUser().getId().equals(userId);
        boolean isVendor = quote.getVendor().getUser() != null && quote.getVendor().getUser().getId().equals(userId);

        if (!isBuyer && !isVendor) {
            throw new ForbiddenException("Access denied to reject this quote");
        }

        quote.setStatus(QuoteStatus.REJECTED);
        if (reason != null && !reason.isBlank()) {
            if (isBuyer) {
                quote.setNotes((quote.getNotes() != null ? quote.getNotes() + "\n" : "") + "[Rejected]: " + reason);
            } else {
                quote.setVendorNotes((quote.getVendorNotes() != null ? quote.getVendorNotes() + "\n" : "") + "[Rejected]: " + reason);
            }
        }
        quote.setUpdatedAt(Instant.now());
        QuoteRequest saved = quoteRequestRepository.save(quote);

        return mapToQuoteDto(saved);
    }

    private QuoteDto mapToQuoteDto(QuoteRequest quote) {
        List<QuoteItem> items = quoteItemRepository.findByQuoteId(quote.getId());
        List<QuoteItemDto> itemDtos = items.stream().map(item -> {
            ProductVariant v = item.getVariant();
            Product p = item.getProduct();
            String primaryImage = null;
            if (p != null && p.getImages() != null && !p.getImages().isEmpty()) {
                primaryImage = p.getImages().stream()
                        .filter(ProductImage::isPrimary)
                        .findFirst()
                        .map(ProductImage::getImageUrl)
                        .orElse(p.getImages().get(0).getImageUrl());
            }

            BigDecimal totalOffered = item.getOfferedUnitPrice() != null
                    ? item.getOfferedUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())).setScale(2, RoundingMode.HALF_UP)
                    : null;

            return QuoteItemDto.builder()
                    .id(item.getId())
                    .quoteRequestId(quote.getId())
                    .variantId(v != null ? v.getId() : null)
                    .productId(p != null ? p.getId() : null)
                    .productTitle(p != null ? p.getTitle() : "Product")
                    .variantSku(v != null ? v.getVariantSku() : null)
                    .variantName(v != null ? v.getVariantName() : null)
                    .primaryImageUrl(primaryImage)
                    .requestedQuantity(item.getQuantity())
                    .targetUnitPrice(item.getRequestedUnitPrice())
                    .offeredUnitPrice(item.getOfferedUnitPrice())
                    .regularPrice(v != null ? v.getPrice() : BigDecimal.ZERO)
                    .totalOfferedAmount(totalOffered)
                    .build();
        }).collect(Collectors.toList());

        return QuoteDto.builder()
                .id(quote.getId())
                .quoteNumber(quote.getQuoteNumber())
                .buyerId(quote.getUser().getId())
                .buyerName(quote.getUser().getFirstName() + " " + quote.getUser().getLastName())
                .buyerEmail(quote.getUser().getEmail())
                .vendorId(quote.getVendor().getId())
                .vendorStoreName(quote.getVendor().getStoreName())
                .status(quote.getStatus())
                .totalTargetAmount(quote.getTargetPrice())
                .totalOfferedAmount(quote.getOfferedPrice())
                .grandOfferedTotal(quote.getOfferedPrice())
                .buyerNotes(quote.getNotes())
                .sellerNotes(quote.getVendorNotes())
                .validUntil(toOffsetDateTime(quote.getExpiresAt()))
                .createdAt(toOffsetDateTime(quote.getCreatedAt()))
                .updatedAt(toOffsetDateTime(quote.getUpdatedAt()))
                .items(itemDtos)
                .build();
    }

    private String generateQuoteNumber() {
        int year = Year.now().getValue();
        int randomDigits = 10000 + RANDOM.nextInt(90000);
        return "RFQ-" + year + "-" + randomDigits;
    }

    private OffsetDateTime toOffsetDateTime(Instant instant) {
        if (instant == null) return null;
        return instant.atZone(ZoneId.systemDefault()).toOffsetDateTime();
    }
}
