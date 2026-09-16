package com.alight.marketplace.modules.product.controller;

import com.alight.marketplace.common.exception.GlobalExceptionHandler;
import com.alight.marketplace.modules.product.dto.CreateProductRequest;
import com.alight.marketplace.modules.product.dto.ProductResponseDto;
import com.alight.marketplace.modules.product.entity.ProductStatus;
import com.alight.marketplace.modules.product.service.VendorProductService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest
@ContextConfiguration(classes = {VendorProductController.class, GlobalExceptionHandler.class})
@AutoConfigureMockMvc(addFilters = false)
class VendorProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private VendorProductService vendorProductService;

    private Principal createMockPrincipal(String email) {
        return new UsernamePasswordAuthenticationToken(email, "pass", List.of(new SimpleGrantedAuthority("ROLE_VENDOR")));
    }

    @Test
    @DisplayName("POST /api/v1/vendor/products should create product and return 201")
    void testCreateProduct() throws Exception {
        UUID categoryId = UUID.randomUUID();
        CreateProductRequest request = CreateProductRequest.builder()
                .categoryId(categoryId)
                .title("Mechanical Keyboard")
                .basePrice(new BigDecimal("129.99"))
                .sku("KEY-MECH-01")
                .stockQuantity(15)
                .build();

        ProductResponseDto response = ProductResponseDto.builder()
                .id(UUID.randomUUID())
                .title("Mechanical Keyboard")
                .slug("mechanical-keyboard")
                .sku("KEY-MECH-01")
                .status(ProductStatus.PENDING_APPROVAL)
                .build();

        when(vendorProductService.createProduct(eq("seller@alight.com"), any(CreateProductRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/vendor/products")
                        .principal(createMockPrincipal("seller@alight.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Mechanical Keyboard"))
                .andExpect(jsonPath("$.data.status").value("PENDING_APPROVAL"));
    }
}
