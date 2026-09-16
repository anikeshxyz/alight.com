package com.alight.marketplace.modules.category.service.impl;

import com.alight.marketplace.common.exception.BusinessRuleException;
import com.alight.marketplace.common.exception.DuplicateResourceException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.category.dto.CategoryDto;
import com.alight.marketplace.modules.category.dto.CategoryTreeDto;
import com.alight.marketplace.modules.category.dto.CreateCategoryRequest;
import com.alight.marketplace.modules.category.dto.UpdateCategoryRequest;
import com.alight.marketplace.modules.category.entity.Category;
import com.alight.marketplace.modules.category.mapper.CategoryMapper;
import com.alight.marketplace.modules.category.repository.CategoryRepository;
import com.alight.marketplace.modules.category.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
public class CategoryServiceImpl implements CategoryService {

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryTreeDto> getPublicCategoryTree() {
        List<Category> rootCategories = categoryRepository.findRootCategoriesActive();
        return rootCategories.stream()
                .map(root -> categoryMapper.toCategoryTreeDto(root, true))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDto> getPublicSubcategories(UUID parentId) {
        return categoryRepository.findByParentIdAndActiveTrueOrderByDisplayOrderAscNameAsc(parentId)
                .stream()
                .map(categoryMapper::toCategoryDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryDto getCategoryBySlug(String slug) {
        Category category = categoryRepository.findBySlugAndActiveTrue(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with slug: " + slug));
        return categoryMapper.toCategoryDto(category);
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryDto getCategoryById(UUID id) {
        Category category = findCategoryEntity(id);
        return categoryMapper.toCategoryDto(category);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategoriesAdmin() {
        return categoryRepository.findAll()
                .stream()
                .map(categoryMapper::toCategoryDto)
                .toList();
    }

    @Override
    @Transactional
    public CategoryDto createCategory(CreateCategoryRequest request) {
        Category parent = null;
        if (request.getParentId() != null) {
            parent = findCategoryEntity(request.getParentId());
        }

        String slug = generateUniqueSlug(request.getName());

        Category category = Category.builder()
                .parent(parent)
                .name(request.getName().trim())
                .slug(slug)
                .description(request.getDescription())
                .iconUrl(request.getIconUrl())
                .bannerUrl(request.getBannerUrl())
                .commissionPercentage(request.getCommissionPercentage())
                .displayOrder(request.getDisplayOrder())
                .active(request.isActive())
                .build();

        Category saved = categoryRepository.save(category);
        log.info("Created category: {} with ID: {}", saved.getName(), saved.getId());
        return categoryMapper.toCategoryDto(saved);
    }

    @Override
    @Transactional
    public CategoryDto updateCategory(UUID id, UpdateCategoryRequest request) {
        Category category = findCategoryEntity(id);

        if (request.getParentId() != null) {
            if (request.getParentId().equals(id)) {
                throw new BusinessRuleException("Category cannot be its own parent");
            }
            Category parent = findCategoryEntity(request.getParentId());
            category.setParent(parent);
        } else {
            category.setParent(null);
        }

        if (!category.getName().equalsIgnoreCase(request.getName().trim())) {
            category.setName(request.getName().trim());
            category.setSlug(generateUniqueSlug(request.getName()));
        }

        category.setDescription(request.getDescription());
        category.setIconUrl(request.getIconUrl());
        category.setBannerUrl(request.getBannerUrl());
        category.setCommissionPercentage(request.getCommissionPercentage());
        category.setDisplayOrder(request.getDisplayOrder());
        category.setActive(request.getActive());

        Category saved = categoryRepository.save(category);
        log.info("Updated category: {} (ID: {})", saved.getName(), saved.getId());
        return categoryMapper.toCategoryDto(saved);
    }

    @Override
    @Transactional
    public void deleteCategory(UUID id) {
        Category category = findCategoryEntity(id);
        categoryRepository.delete(category);
        log.info("Deleted category: {} (ID: {})", category.getName(), id);
    }

    private Category findCategoryEntity(UUID id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + id));
    }

    private String generateUniqueSlug(String name) {
        String nowhitespace = WHITESPACE.matcher(name).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("").toLowerCase(Locale.ENGLISH);

        if (slug.isEmpty()) {
            slug = "cat-" + UUID.randomUUID().toString().substring(0, 8);
        }

        String baseSlug = slug;
        int count = 1;
        while (categoryRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + count++;
        }
        return slug;
    }
}
