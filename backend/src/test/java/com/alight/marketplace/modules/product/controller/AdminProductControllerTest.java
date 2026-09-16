package com.alight.marketplace.modules.product.controller;

import com.alight.marketplace.common.exception.GlobalExceptionHandler;
import com.alight.marketplace.modules.product.dto.ProductResponseDto;
import com.alight.marketplace.modules.product.dto.UpdateProductStatusRequest;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import com.alight.marketplace.modules.product.service.AdminProductService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest
@ContextConfiguration(classes = {AdminProductController.class, GlobalExceptionHandler.class})
@AutoConfigureMockMvc(addFilters = false)
class AdminProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminProductService adminProductService;

    @Test
    @DisplayName("PUT /api/v1/admin/products/{id}/status should update product status")
    void testUpdateProductStatus() throws Exception {
        UUID productId = UUID.randomUUID();
        UpdateProductStatusRequest request = UpdateProductStatusRequest.builder()
                .status(ProductStatus.ACTIVE)
                .build();

        ProductResponseDto response = ProductResponseDto.builder()
                .id(productId)
                .title("Mechanical Keyboard")
                .status(ProductStatus.ACTIVE)
                .build();

        when(adminProductService.updateProductStatus(eq(productId), any(UpdateProductStatusRequest.class)))
                .thenReturn(response);

        mockMvc.perform(put("/api/v1/admin/products/" + productId + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }
}
