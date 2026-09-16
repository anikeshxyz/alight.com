package com.alight.marketplace.modules.category.service;

import com.alight.marketplace.common.exception.DuplicateResourceException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.category.dto.BrandDto;
import com.alight.marketplace.modules.category.dto.CreateBrandRequest;
import com.alight.marketplace.modules.category.entity.Brand;
import com.alight.marketplace.modules.category.mapper.BrandMapper;
import com.alight.marketplace.modules.category.repository.BrandRepository;
import com.alight.marketplace.modules.category.service.impl.BrandServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BrandServiceTest {

    @Mock
    private BrandRepository brandRepository;

    @Spy
    private BrandMapper brandMapper = new BrandMapper();

    @InjectMocks
    private BrandServiceImpl brandService;

    private Brand appleBrand;

    @BeforeEach
    void setUp() {
        appleBrand = Brand.builder()
                .id(UUID.randomUUID())
                .name("Apple")
                .slug("apple")
                .websiteUrl("https://apple.com")
                .active(true)
                .build();
    }

    @Test
    @DisplayName("Should return active brands")
    void testGetActiveBrands() {
        when(brandRepository.findByActiveTrueOrderByNameAsc()).thenReturn(List.of(appleBrand));

        List<BrandDto> brands = brandService.getActiveBrands();

        assertNotNull(brands);
        assertEquals(1, brands.size());
        assertEquals("Apple", brands.get(0).getName());
    }

    @Test
    @DisplayName("Should create brand successfully")
    void testCreateBrand() {
        CreateBrandRequest request = CreateBrandRequest.builder()
                .name("Sony")
                .websiteUrl("https://sony.com")
                .active(true)
                .build();

        Brand saved = Brand.builder()
                .id(UUID.randomUUID())
                .name("Sony")
                .slug("sony")
                .websiteUrl("https://sony.com")
                .active(true)
                .build();

        when(brandRepository.existsByName("Sony")).thenReturn(false);
        when(brandRepository.existsBySlug("sony")).thenReturn(false);
        when(brandRepository.save(any(Brand.class))).thenReturn(saved);

        BrandDto result = brandService.createBrand(request);

        assertNotNull(result);
        assertEquals("Sony", result.getName());
        assertEquals("sony", result.getSlug());
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException on duplicate brand name")
    void testCreateDuplicateBrand() {
        CreateBrandRequest request = CreateBrandRequest.builder()
                .name("Apple")
                .build();

        when(brandRepository.existsByName("Apple")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () ->
                brandService.createBrand(request)
        );
    }
}
