package com.alight.marketplace.modules.coupon.service;

import com.alight.marketplace.modules.coupon.dto.PromotionBannerDto;

import java.util.List;
import java.util.UUID;

public interface PromotionService {

    List<PromotionBannerDto> getActivePromotions();

    List<PromotionBannerDto> getAllPromotionsAdmin();

    PromotionBannerDto createPromotion(PromotionBannerDto dto);

    PromotionBannerDto updatePromotion(UUID id, PromotionBannerDto dto);

    void deletePromotion(UUID id);
}
