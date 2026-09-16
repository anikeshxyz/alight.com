package com.alight.marketplace.modules.category.service.impl;

import com.alight.marketplace.common.exception.DuplicateResourceException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.category.dto.BrandDto;
import com.alight.marketplace.modules.category.dto.CreateBrandRequest;
import com.alight.marketplace.modules.category.dto.UpdateBrandRequest;
import com.alight.marketplace.modules.category.entity.Brand;
import com.alight.marketplace.modules.category.mapper.BrandMapper;
import com.alight.marketplace.modules.category.repository.BrandRepository;
import com.alight.marketplace.modules.category.service.BrandService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class BrandServiceImpl implements BrandService {

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    private final BrandRepository brandRepository;
    private final BrandMapper brandMapper;

    @Override
    @Transactional(readOnly = true)
    public List<BrandDto> getActiveBrands() {
        return brandRepository.findByActiveTrueOrderByNameAsc()
                .stream()
                .map(brandMapper::toBrandDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BrandDto getBrandBySlug(String slug) {
        Brand brand = brandRepository.findBySlugAndActiveTrue(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with slug: " + slug));
        return brandMapper.toBrandDto(brand);
    }

    @Override
    @Transactional(readOnly = true)
    public BrandDto getBrandById(UUID id) {
        Brand brand = findBrandEntity(id);
        return brandMapper.toBrandDto(brand);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BrandDto> searchBrandsAdmin(String search, Pageable pageable) {
        return brandRepository.searchBrands(search, pageable)
                .map(brandMapper::toBrandDto);
    }

    @Override
    @Transactional
    public BrandDto createBrand(CreateBrandRequest request) {
        if (brandRepository.existsByName(request.getName().trim())) {
            throw new DuplicateResourceException("Brand name already exists: " + request.getName());
        }

        String slug = generateUniqueSlug(request.getName());

        Brand brand = Brand.builder()
                .name(request.getName().trim())
                .slug(slug)
                .logoUrl(request.getLogoUrl())
                .websiteUrl(request.getWebsiteUrl())
                .description(request.getDescription())
                .featured(request.isFeatured())
                .active(request.isActive())
                .build();

        Brand saved = brandRepository.save(brand);
        log.info("Created brand: {} with ID: {}", saved.getName(), saved.getId());
        return brandMapper.toBrandDto(saved);
    }

    @Override
    @Transactional
    public BrandDto updateBrand(UUID id, UpdateBrandRequest request) {
        Brand brand = findBrandEntity(id);

        if (!brand.getName().equalsIgnoreCase(request.getName().trim())) {
            if (brandRepository.existsByName(request.getName().trim())) {
                throw new DuplicateResourceException("Brand name already exists: " + request.getName());
            }
            brand.setName(request.getName().trim());
            brand.setSlug(generateUniqueSlug(request.getName()));
        }

        brand.setLogoUrl(request.getLogoUrl());
        brand.setWebsiteUrl(request.getWebsiteUrl());
        brand.setDescription(request.getDescription());
        if (request.getFeatured() != null) {
            brand.setFeatured(request.getFeatured());
        }
        brand.setActive(request.getActive());

        Brand saved = brandRepository.save(brand);
        log.info("Updated brand: {} (ID: {})", saved.getName(), saved.getId());
        return brandMapper.toBrandDto(saved);
    }

    @Override
    @Transactional
    public void deleteBrand(UUID id) {
        Brand brand = findBrandEntity(id);
        brandRepository.delete(brand);
        log.info("Deleted brand: {} (ID: {})", brand.getName(), id);
    }

    private Brand findBrandEntity(UUID id) {
        return brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with ID: " + id));
    }

    private String generateUniqueSlug(String name) {
        String nowhitespace = WHITESPACE.matcher(name).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("").toLowerCase(Locale.ENGLISH);

        if (slug.isEmpty()) {
            slug = "brand-" + UUID.randomUUID().toString().substring(0, 8);
        }

        String baseSlug = slug;
        int count = 1;
        while (brandRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + count++;
        }
        return slug;
    }
}
