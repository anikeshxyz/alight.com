package com.alight.marketplace.modules.vendor.controller;

import com.alight.marketplace.common.exception.GlobalExceptionHandler;
import com.alight.marketplace.modules.vendor.dto.*;
import com.alight.marketplace.modules.vendor.entity.BusinessType;
import com.alight.marketplace.modules.vendor.entity.VendorStatus;
import com.alight.marketplace.modules.vendor.service.VendorService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest
@ContextConfiguration(classes = {VendorController.class, GlobalExceptionHandler.class})
@AutoConfigureMockMvc(addFilters = false)
class VendorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private VendorService vendorService;

    private Principal createMockPrincipal(String email) {
        return new UsernamePasswordAuthenticationToken(email, "pass", List.of(new SimpleGrantedAuthority("ROLE_VENDOR")));
    }

    @Test
    @DisplayName("POST /api/v1/vendors/apply should create vendor application and return 201")
    void testApplyVendor() throws Exception {
        VendorApplicationRequest request = VendorApplicationRequest.builder()
                .storeName("Urban Tech Store")
                .supportEmail("support@urbantech.com")
                .supportPhone("+919876543210")
                .legalBusinessName("Urban Tech LLP")
                .businessType(BusinessType.PARTNERSHIP)
                .bankAccountNumber("123456789")
                .bankIfscCode("SBIN0001234")
                .bankName("State Bank of India")
                .bankAccountHolderName("Urban Tech LLP")
                .pickupContactPerson("Rajesh Kumar")
                .pickupContactPhone("+919876543210")
                .pickupAddressLine1("10 Commercial Street")
                .pickupCity("Bengaluru")
                .pickupState("Karnataka")
                .pickupPostalCode("560001")
                .build();

        VendorResponseDto response = VendorResponseDto.builder()
                .id(UUID.randomUUID())
                .storeName("Urban Tech Store")
                .slug("urban-tech-store")
                .status(VendorStatus.PENDING_VERIFICATION)
                .commissionPercentage(new BigDecimal("10.00"))
                .build();

        when(vendorService.applyAsVendor(eq("seller@alight.com"), any(VendorApplicationRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/vendors/apply")
                        .principal(createMockPrincipal("seller@alight.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.storeName").value("Urban Tech Store"))
                .andExpect(jsonPath("$.data.status").value("PENDING_VERIFICATION"));
    }

    @Test
    @DisplayName("GET /api/v1/vendors/me should return current vendor details")
    void testGetCurrentVendor() throws Exception {
        VendorResponseDto response = VendorResponseDto.builder()
                .id(UUID.randomUUID())
                .storeName("Urban Tech Store")
                .slug("urban-tech-store")
                .status(VendorStatus.APPROVED)
                .build();

        when(vendorService.getCurrentVendor("seller@alight.com")).thenReturn(response);

        mockMvc.perform(get("/api/v1/vendors/me")
                        .principal(createMockPrincipal("seller@alight.com"))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.slug").value("urban-tech-store"));
    }

    @Test
    @DisplayName("GET /api/v1/vendors/stores/{slug} should return public storefront data")
    void testGetPublicStore() throws Exception {
        PublicVendorStoreDto store = PublicVendorStoreDto.builder()
                .id(UUID.randomUUID())
                .storeName("Urban Tech Store")
                .slug("urban-tech-store")
                .description("Top tech gear")
                .build();

        when(vendorService.getPublicStoreBySlug("urban-tech-store")).thenReturn(store);

        mockMvc.perform(get("/api/v1/vendors/stores/urban-tech-store")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.storeName").value("Urban Tech Store"));
    }
}
