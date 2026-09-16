package com.alight.marketplace.modules.pricing.service;

import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.currency.dto.CurrencyDto;
import com.alight.marketplace.modules.currency.service.CurrencyService;
import com.alight.marketplace.modules.pricing.dto.CreateTierPriceRequest;
import com.alight.marketplace.modules.pricing.dto.PriceCalculationRequest;
import com.alight.marketplace.modules.pricing.dto.PriceCalculationResponse;
import com.alight.marketplace.modules.pricing.dto.ProductTierPriceDto;
import com.alight.marketplace.modules.pricing.entity.ProductTierPrice;
import com.alight.marketplace.modules.pricing.repository.ProductTierPriceRepository;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.entity.ProductVariant;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.product.repository.ProductVariantRepository;
import com.alight.marketplace.modules.tax.dto.TaxCalculationRequest;
import com.alight.marketplace.modules.tax.dto.TaxCalculationResponse;
import com.alight.marketplace.modules.tax.service.TaxCalculationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PricingServiceImpl implements PricingService {

    private final ProductTierPriceRepository productTierPriceRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CurrencyService currencyService;
    private final TaxCalculationService taxCalculationService;

    @Override
    @Transactional(readOnly = true)
    public List<ProductTierPriceDto> getProductTiers(UUID productId) {
        return productTierPriceRepository.findByProductIdOrderByMinQuantityAsc(productId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ProductTierPriceDto createTierPrice(UUID productId, CreateTierPriceRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        ProductVariant variant = null;
        if (request.getVariantId() != null) {
            variant = productVariantRepository.findById(request.getVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Variant not found with id: " + request.getVariantId()));
        }

        BigDecimal discount = request.getDiscountPercent();
        if (discount == null && product.getBasePrice() != null && product.getBasePrice().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal base = product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getBasePrice();
            if (base.compareTo(request.getTierPrice()) > 0) {
                discount = base.subtract(request.getTierPrice())
                        .divide(base, 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"))
                        .setScale(2, RoundingMode.HALF_UP);
            } else {
                discount = BigDecimal.ZERO;
            }
        }

        ProductTierPrice tier = ProductTierPrice.builder()
                .product(product)
                .variant(variant)
                .minQuantity(request.getMinQuantity())
                .maxQuantity(request.getMaxQuantity())
                .tierPrice(request.getTierPrice())
                .discountPercent(discount != null ? discount : BigDecimal.ZERO)
                .build();

        ProductTierPrice saved = productTierPriceRepository.save(tier);
        log.info("Created tier price for product {} (min qty: {})", productId, request.getMinQuantity());
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public void deleteTierPrice(UUID tierId) {
        if (!productTierPriceRepository.existsById(tierId)) {
            throw new ResourceNotFoundException("Tier price not found with id: " + tierId);
        }
        productTierPriceRepository.deleteById(tierId);
    }

    @Override
    @Transactional(readOnly = true)
    public PriceCalculationResponse calculatePrice(PriceCalculationRequest request) {
        ProductVariant variant = null;
        if (request.getVariantId() != null) {
            variant = productVariantRepository.findById(request.getVariantId())
                    .orElse(null);
        }

        Product product = null;
        if (request.getProductId() != null) {
            product = productRepository.findById(request.getProductId()).orElse(null);
        } else if (variant != null) {
            product = variant.getProduct();
        }

        if (product == null && variant != null) {
            product = variant.getProduct();
        }

        if (product == null) {
            throw new ResourceNotFoundException("Product not found with id: " + request.getProductId());
        }

        int quantity = request.getQuantity() != null && request.getQuantity() > 0 ? request.getQuantity() : 1;
        String targetCurrencyCode = request.getTargetCurrency() != null && !request.getTargetCurrency().isBlank()
                ? request.getTargetCurrency().toUpperCase() : "INR";

        CurrencyDto targetCurrency = currencyService.getCurrencyByCode(targetCurrencyCode);

        // 1. Regular Unit Price (Base Currency: INR)
        BigDecimal regularUnitPriceInr;
        if (variant != null && variant.getPrice() != null) {
            regularUnitPriceInr = variant.getPrice();
        } else if (product.getDiscountPrice() != null) {
            regularUnitPriceInr = product.getDiscountPrice();
        } else {
            regularUnitPriceInr = product.getBasePrice();
        }

        // 2. Check Volume Tier Price
        List<ProductTierPrice> matchedTiers = productTierPriceRepository.findMatchingTiers(
                product.getId(),
                variant != null ? variant.getId() : null,
                quantity);

        BigDecimal effectiveUnitPriceInr = regularUnitPriceInr;
        BigDecimal discountPercent = BigDecimal.ZERO;
        boolean isTierApplied = false;

        if (!matchedTiers.isEmpty()) {
            ProductTierPrice bestTier = matchedTiers.get(0);
            effectiveUnitPriceInr = bestTier.getTierPrice();
            discountPercent = bestTier.getDiscountPercent() != null ? bestTier.getDiscountPercent() : BigDecimal.ZERO;
            isTierApplied = true;
        }

        // 3. Convert to Target Currency
        BigDecimal regularUnitPrice = currencyService.convertAmount(regularUnitPriceInr, "INR", targetCurrencyCode);
        BigDecimal effectiveUnitPrice = currencyService.convertAmount(effectiveUnitPriceInr, "INR", targetCurrencyCode);

        BigDecimal subtotal = effectiveUnitPrice.multiply(BigDecimal.valueOf(quantity)).setScale(targetCurrency.getDecimalPlaces(), RoundingMode.HALF_UP);
        BigDecimal regularTotal = regularUnitPrice.multiply(BigDecimal.valueOf(quantity)).setScale(targetCurrency.getDecimalPlaces(), RoundingMode.HALF_UP);
        BigDecimal totalDiscount = regularTotal.subtract(subtotal).max(BigDecimal.ZERO);

        // 4. Calculate Tax Details
        TaxCalculationRequest taxReq = TaxCalculationRequest.builder()
                .unitPrice(effectiveUnitPrice)
                .quantity(quantity)
                .originState(request.getOriginState())
                .destinationState(request.getDestinationState())
                .destinationCountry(request.getDestinationCountry() != null ? request.getDestinationCountry() : "IN")
                .destinationPostalCode(request.getDestinationPostalCode())
                .isTaxInclusive(true)
                .build();

        TaxCalculationResponse taxResp = taxCalculationService.calculateTax(taxReq);

        BigDecimal grandTotal = subtotal; // If inclusive
        String formattedGrandTotal = targetCurrency.getSymbol() + " " + grandTotal.toPlainString();

        List<ProductTierPriceDto> availableTiers = productTierPriceRepository
                .findByProductIdOrderByMinQuantityAsc(product.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return PriceCalculationResponse.builder()
                .productId(product.getId())
                .variantId(variant != null ? variant.getId() : null)
                .quantity(quantity)
                .currency(targetCurrency.getCode())
                .currencySymbol(targetCurrency.getSymbol())
                .regularUnitPrice(regularUnitPrice)
                .effectiveUnitPrice(effectiveUnitPrice)
                .discountPercentage(discountPercent)
                .isTierPriceApplied(isTierApplied)
                .subtotal(subtotal)
                .totalDiscountAmount(totalDiscount)
                .totalTaxAmount(taxResp.getTotalTaxAmount())
                .grandTotal(grandTotal)
                .formattedGrandTotal(formattedGrandTotal)
                .taxDetails(taxResp)
                .availableTiers(availableTiers)
                .build();
    }

    private ProductTierPriceDto mapToDto(ProductTierPrice tier) {
        return ProductTierPriceDto.builder()
                .id(tier.getId())
                .productId(tier.getProduct().getId())
                .variantId(tier.getVariant() != null ? tier.getVariant().getId() : null)
                .minQuantity(tier.getMinQuantity())
                .maxQuantity(tier.getMaxQuantity())
                .tierPrice(tier.getTierPrice())
                .discountPercent(tier.getDiscountPercent())
                .build();
    }
}
