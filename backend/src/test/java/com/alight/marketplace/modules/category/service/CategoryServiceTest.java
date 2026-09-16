package com.alight.marketplace.modules.category.service;

import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.category.dto.CategoryDto;
import com.alight.marketplace.modules.category.dto.CategoryTreeDto;
import com.alight.marketplace.modules.category.dto.CreateCategoryRequest;
import com.alight.marketplace.modules.category.entity.Category;
import com.alight.marketplace.modules.category.mapper.CategoryMapper;
import com.alight.marketplace.modules.category.repository.CategoryRepository;
import com.alight.marketplace.modules.category.service.impl.CategoryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Spy
    private CategoryMapper categoryMapper = new CategoryMapper();

    @InjectMocks
    private CategoryServiceImpl categoryService;

    private Category electronicsCategory;
    private Category phoneCategory;

    @BeforeEach
    void setUp() {
        electronicsCategory = Category.builder()
                .id(UUID.randomUUID())
                .name("Electronics")
                .slug("electronics")
                .displayOrder(1)
                .active(true)
                .children(new ArrayList<>())
                .build();

        phoneCategory = Category.builder()
                .id(UUID.randomUUID())
                .parent(electronicsCategory)
                .name("Smartphones")
                .slug("smartphones")
                .displayOrder(1)
                .active(true)
                .build();

        electronicsCategory.getChildren().add(phoneCategory);
    }

    @Test
    @DisplayName("Should return active category tree")
    void testGetPublicCategoryTree() {
        when(categoryRepository.findRootCategoriesActive()).thenReturn(List.of(electronicsCategory));

        List<CategoryTreeDto> tree = categoryService.getPublicCategoryTree();

        assertNotNull(tree);
        assertEquals(1, tree.size());
        assertEquals("Electronics", tree.get(0).getName());
        assertEquals(1, tree.get(0).getChildren().size());
        assertEquals("Smartphones", tree.get(0).getChildren().get(0).getName());
    }

    @Test
    @DisplayName("Should create new root category")
    void testCreateCategory() {
        CreateCategoryRequest request = CreateCategoryRequest.builder()
                .name("Appliances")
                .displayOrder(2)
                .active(true)
                .build();

        Category savedCategory = Category.builder()
                .id(UUID.randomUUID())
                .name("Appliances")
                .slug("appliances")
                .displayOrder(2)
                .active(true)
                .build();

        when(categoryRepository.existsBySlug("appliances")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenReturn(savedCategory);

        CategoryDto result = categoryService.createCategory(request);

        assertNotNull(result);
        assertEquals("Appliances", result.getName());
        assertEquals("appliances", result.getSlug());
        verify(categoryRepository, times(1)).save(any(Category.class));
    }

    @Test
    @DisplayName("Should find category by slug")
    void testGetCategoryBySlug() {
        when(categoryRepository.findBySlugAndActiveTrue("electronics")).thenReturn(Optional.of(electronicsCategory));

        CategoryDto result = categoryService.getCategoryBySlug("electronics");

        assertNotNull(result);
        assertEquals("Electronics", result.getName());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException for unknown slug")
    void testGetCategoryBySlugNotFound() {
        when(categoryRepository.findBySlugAndActiveTrue("unknown")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                categoryService.getCategoryBySlug("unknown")
        );
    }
}
