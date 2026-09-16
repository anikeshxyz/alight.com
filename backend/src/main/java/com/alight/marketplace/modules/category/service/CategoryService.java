package com.alight.marketplace.modules.category.service;

import com.alight.marketplace.modules.category.dto.CategoryDto;
import com.alight.marketplace.modules.category.dto.CategoryTreeDto;
import com.alight.marketplace.modules.category.dto.CreateCategoryRequest;
import com.alight.marketplace.modules.category.dto.UpdateCategoryRequest;

import java.util.List;
import java.util.UUID;

public interface CategoryService {

    List<CategoryTreeDto> getPublicCategoryTree();

    List<CategoryDto> getPublicSubcategories(UUID parentId);

    CategoryDto getCategoryBySlug(String slug);

    CategoryDto getCategoryById(UUID id);

    List<CategoryDto> getAllCategoriesAdmin();

    CategoryDto createCategory(CreateCategoryRequest request);

    CategoryDto updateCategory(UUID id, UpdateCategoryRequest request);

    void deleteCategory(UUID id);
}
