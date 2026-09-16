package com.alight.marketplace.modules.tax.service;

import com.alight.marketplace.modules.tax.dto.TaxCategoryDto;
import com.alight.marketplace.modules.tax.entity.TaxCategory;

import java.util.List;
import java.util.UUID;

public interface TaxManagementService {
    List<TaxCategoryDto> getAllActiveTaxCategories();
    List<TaxCategoryDto> listAllCategoriesAdmin();
    TaxCategoryDto getCategoryByCode(String code);
    TaxCategoryDto createCategory(TaxCategoryDto dto);
    TaxCategoryDto updateCategory(UUID id, TaxCategoryDto dto);
}
