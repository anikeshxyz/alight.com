package com.alight.marketplace.modules.pricing.service;

import com.alight.marketplace.modules.pricing.dto.CreateTierPriceRequest;
import com.alight.marketplace.modules.pricing.dto.PriceCalculationRequest;
import com.alight.marketplace.modules.pricing.dto.PriceCalculationResponse;
import com.alight.marketplace.modules.pricing.dto.ProductTierPriceDto;

import java.util.List;
import java.util.UUID;

public interface PricingService {
    List<ProductTierPriceDto> getProductTiers(UUID productId);
    ProductTierPriceDto createTierPrice(UUID productId, CreateTierPriceRequest request);
    void deleteTierPrice(UUID tierId);
    PriceCalculationResponse calculatePrice(PriceCalculationRequest request);
}
