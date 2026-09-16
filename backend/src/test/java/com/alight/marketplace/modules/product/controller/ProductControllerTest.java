package com.alight.marketplace.modules.product.controller;

import com.alight.marketplace.common.exception.GlobalExceptionHandler;
import com.alight.marketplace.modules.product.dto.ProductDetailDto;
import com.alight.marketplace.modules.product.dto.ProductSummaryDto;
import com.alight.marketplace.modules.product.service.ProductService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest
@ContextConfiguration(classes = {ProductController.class, GlobalExceptionHandler.class})
@AutoConfigureMockMvc(addFilters = false)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductService productService;

    @Test
    @DisplayName("GET /api/v1/products should return paged summary of products")
    void testSearchProducts() throws Exception {
        ProductSummaryDto summary = ProductSummaryDto.builder()
                .id(UUID.randomUUID())
                .title("Ergonomic Keyboard")
                .slug("ergonomic-keyboard")
                .basePrice(new BigDecimal("89.99"))
                .stockQuantity(10)
                .inStock(true)
                .build();

        when(productService.searchProducts(any(), any(), any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(summary)));

        mockMvc.perform(get("/api/v1/products")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].title").value("Ergonomic Keyboard"));
    }

    @Test
    @DisplayName("GET /api/v1/products/{slug} should return product detail")
    void testGetProductBySlug() throws Exception {
        ProductDetailDto detail = ProductDetailDto.builder()
                .id(UUID.randomUUID())
                .title("Ergonomic Keyboard")
                .slug("ergonomic-keyboard")
                .basePrice(new BigDecimal("89.99"))
                .sku("KEY-ERGO-01")
                .build();

        when(productService.getProductBySlug("ergonomic-keyboard")).thenReturn(detail);

        mockMvc.perform(get("/api/v1/products/ergonomic-keyboard")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.sku").value("KEY-ERGO-01"));
    }
}
