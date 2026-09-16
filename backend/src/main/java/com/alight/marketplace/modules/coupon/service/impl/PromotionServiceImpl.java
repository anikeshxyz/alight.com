package com.alight.marketplace.modules.coupon.service.impl;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.coupon.dto.PromotionBannerDto;
import com.alight.marketplace.modules.coupon.entity.Promotion;
import com.alight.marketplace.modules.coupon.repository.PromotionRepository;
import com.alight.marketplace.modules.coupon.service.PromotionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PromotionServiceImpl implements PromotionService {

    private final PromotionRepository promotionRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PromotionBannerDto> getActivePromotions() {
        return promotionRepository.findActivePromotions(Instant.now()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PromotionBannerDto> getAllPromotionsAdmin() {
        return promotionRepository.findAllByOrderByDisplayOrderAscCreatedAtDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PromotionBannerDto createPromotion(PromotionBannerDto dto) {
        String slug = dto.getSlug();
        if (slug == null || slug.isBlank()) {
            slug = dto.getTitle().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        }

        if (promotionRepository.findBySlug(slug).isPresent()) {
            slug = slug + "-" + System.currentTimeMillis();
        }

        Promotion promotion = Promotion.builder()
                .title(dto.getTitle())
                .slug(slug)
                .bannerImageUrl(dto.getBannerImageUrl())
                .bannerTag(dto.getBannerTag())
                .badgeText(dto.getBadgeText())
                .discountText(dto.getDiscountText())
                .targetUrl(dto.getTargetUrl())
                .startTime(dto.getStartTime() != null ? dto.getStartTime() : Instant.now())
                .endTime(dto.getEndTime())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .displayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0)
                .build();

        return mapToDto(promotionRepository.save(promotion));
    }

    @Override
    @Transactional
    public PromotionBannerDto updatePromotion(UUID id, PromotionBannerDto dto) {
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Promotion banner not found with id: " + id));

        if (dto.getTitle() != null) promotion.setTitle(dto.getTitle());
        if (dto.getBannerImageUrl() != null) promotion.setBannerImageUrl(dto.getBannerImageUrl());
        if (dto.getBannerTag() != null) promotion.setBannerTag(dto.getBannerTag());
        if (dto.getBadgeText() != null) promotion.setBadgeText(dto.getBadgeText());
        if (dto.getDiscountText() != null) promotion.setDiscountText(dto.getDiscountText());
        if (dto.getTargetUrl() != null) promotion.setTargetUrl(dto.getTargetUrl());
        if (dto.getStartTime() != null) promotion.setStartTime(dto.getStartTime());
        if (dto.getEndTime() != null) promotion.setEndTime(dto.getEndTime());
        if (dto.getIsActive() != null) promotion.setIsActive(dto.getIsActive());
        if (dto.getDisplayOrder() != null) promotion.setDisplayOrder(dto.getDisplayOrder());

        return mapToDto(promotionRepository.save(promotion));
    }

    @Override
    @Transactional
    public void deletePromotion(UUID id) {
        if (!promotionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Promotion banner not found with id: " + id);
        }
        promotionRepository.deleteById(id);
    }

    private PromotionBannerDto mapToDto(Promotion p) {
        return PromotionBannerDto.builder()
                .id(p.getId())
                .title(p.getTitle())
                .slug(p.getSlug())
                .bannerImageUrl(p.getBannerImageUrl())
                .bannerTag(p.getBannerTag())
                .badgeText(p.getBadgeText())
                .discountText(p.getDiscountText())
                .targetUrl(p.getTargetUrl())
                .startTime(p.getStartTime())
                .endTime(p.getEndTime())
                .isActive(p.getIsActive())
                .displayOrder(p.getDisplayOrder())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
