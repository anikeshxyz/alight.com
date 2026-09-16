package com.alight.marketplace.modules.tax.service;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.tax.dto.TaxCategoryDto;
import com.alight.marketplace.modules.tax.entity.TaxCategory;
import com.alight.marketplace.modules.tax.repository.TaxCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaxManagementServiceImpl implements TaxManagementService {

    private final TaxCategoryRepository taxCategoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TaxCategoryDto> getAllActiveTaxCategories() {
        return taxCategoryRepository.findByIsActiveTrueOrderByNameAsc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaxCategoryDto> listAllCategoriesAdmin() {
        return taxCategoryRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TaxCategoryDto getCategoryByCode(String code) {
        TaxCategory cat = taxCategoryRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new ResourceNotFoundException("Tax category not found with code: " + code));
        return mapToDto(cat);
    }

    @Override
    @Transactional
    public TaxCategoryDto createCategory(TaxCategoryDto dto) {
        if (taxCategoryRepository.existsByCodeIgnoreCase(dto.getCode())) {
            throw new BadRequestException("Tax category code already exists: " + dto.getCode());
        }

        TaxCategory cat = TaxCategory.builder()
                .code(dto.getCode().toUpperCase().trim())
                .name(dto.getName())
                .hsnSacCode(dto.getHsnSacCode())
                .description(dto.getDescription())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .build();

        TaxCategory saved = taxCategoryRepository.save(cat);
        log.info("Created tax category: {}", saved.getCode());
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public TaxCategoryDto updateCategory(UUID id, TaxCategoryDto dto) {
        TaxCategory cat = taxCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tax category not found with id: " + id));

        cat.setName(dto.getName());
        cat.setHsnSacCode(dto.getHsnSacCode());
        cat.setDescription(dto.getDescription());
        if (dto.getIsActive() != null) {
            cat.setIsActive(dto.getIsActive());
        }

        TaxCategory saved = taxCategoryRepository.save(cat);
        return mapToDto(saved);
    }

    private TaxCategoryDto mapToDto(TaxCategory cat) {
        return TaxCategoryDto.builder()
                .id(cat.getId())
                .code(cat.getCode())
                .name(cat.getName())
                .hsnSacCode(cat.getHsnSacCode())
                .description(cat.getDescription())
                .isActive(cat.getIsActive())
                .createdAt(cat.getCreatedAt())
                .build();
    }
}
