package com.alight.marketplace.modules.category.controller;

import com.alight.marketplace.common.exception.GlobalExceptionHandler;
import com.alight.marketplace.modules.category.dto.CategoryDto;
import com.alight.marketplace.modules.category.dto.CategoryTreeDto;
import com.alight.marketplace.modules.category.service.CategoryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest
@ContextConfiguration(classes = {CategoryController.class, GlobalExceptionHandler.class})
@AutoConfigureMockMvc(addFilters = false)
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CategoryService categoryService;

    @Test
    @DisplayName("GET /api/v1/categories/tree should return category tree")
    void testGetCategoryTree() throws Exception {
        CategoryTreeDto root = CategoryTreeDto.builder()
                .id(UUID.randomUUID())
                .name("Electronics")
                .slug("electronics")
                .active(true)
                .build();

        when(categoryService.getPublicCategoryTree()).thenReturn(List.of(root));

        mockMvc.perform(get("/api/v1/categories/tree")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].name").value("Electronics"));
    }

    @Test
    @DisplayName("GET /api/v1/categories/{slug} should return category by slug")
    void testGetCategoryBySlug() throws Exception {
        CategoryDto dto = CategoryDto.builder()
                .id(UUID.randomUUID())
                .name("Smartphones")
                .slug("smartphones")
                .build();

        when(categoryService.getCategoryBySlug("smartphones")).thenReturn(dto);

        mockMvc.perform(get("/api/v1/categories/smartphones")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.slug").value("smartphones"));
    }
}
