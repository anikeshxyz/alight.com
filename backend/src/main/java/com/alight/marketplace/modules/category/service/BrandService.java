package com.alight.marketplace.modules.category.service;

import com.alight.marketplace.modules.category.dto.BrandDto;
import com.alight.marketplace.modules.category.dto.CreateBrandRequest;
import com.alight.marketplace.modules.category.dto.UpdateBrandRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface BrandService {

    List<BrandDto> getActiveBrands();

    BrandDto getBrandBySlug(String slug);

    BrandDto getBrandById(UUID id);

    Page<BrandDto> searchBrandsAdmin(String search, Pageable pageable);

    BrandDto createBrand(CreateBrandRequest request);

    BrandDto updateBrand(UUID id, UpdateBrandRequest request);

    void deleteBrand(UUID id);
}
