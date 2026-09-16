package com.alight.marketplace.modules.vendor.controller;

import com.alight.marketplace.common.exception.GlobalExceptionHandler;
import com.alight.marketplace.modules.vendor.dto.UpdateCommissionRequest;
import com.alight.marketplace.modules.vendor.dto.UpdateVendorStatusRequest;
import com.alight.marketplace.modules.vendor.dto.VendorResponseDto;
import com.alight.marketplace.modules.vendor.entity.VendorStatus;
import com.alight.marketplace.modules.vendor.service.AdminVendorService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest
@ContextConfiguration(classes = {AdminVendorController.class, GlobalExceptionHandler.class})
@AutoConfigureMockMvc(addFilters = false)
class AdminVendorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminVendorService adminVendorService;

    @Test
    @DisplayName("GET /api/v1/admin/vendors should return paged list of vendors")
    void testListVendors() throws Exception {
        VendorResponseDto vendor = VendorResponseDto.builder()
                .id(UUID.randomUUID())
                .storeName("Supreme Stores")
                .status(VendorStatus.PENDING_VERIFICATION)
                .build();

        when(adminVendorService.listVendors(any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(vendor)));

        mockMvc.perform(get("/api/v1/admin/vendors")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].storeName").value("Supreme Stores"));
    }

    @Test
    @DisplayName("PUT /api/v1/admin/vendors/{id}/status should update vendor status")
    void testUpdateVendorStatus() throws Exception {
        UUID vendorId = UUID.randomUUID();
        UpdateVendorStatusRequest request = UpdateVendorStatusRequest.builder()
                .status(VendorStatus.APPROVED)
                .build();

        VendorResponseDto updated = VendorResponseDto.builder()
                .id(vendorId)
                .storeName("Supreme Stores")
                .status(VendorStatus.APPROVED)
                .build();

        when(adminVendorService.updateVendorStatus(eq(vendorId), any(UpdateVendorStatusRequest.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/v1/admin/vendors/" + vendorId + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("APPROVED"));
    }

    @Test
    @DisplayName("PUT /api/v1/admin/vendors/{id}/commission should update commission rate")
    void testUpdateCommission() throws Exception {
        UUID vendorId = UUID.randomUUID();
        UpdateCommissionRequest request = UpdateCommissionRequest.builder()
                .commissionPercentage(new BigDecimal("12.50"))
                .build();

        VendorResponseDto updated = VendorResponseDto.builder()
                .id(vendorId)
                .storeName("Supreme Stores")
                .commissionPercentage(new BigDecimal("12.50"))
                .build();

        when(adminVendorService.updateCommission(eq(vendorId), any(UpdateCommissionRequest.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/v1/admin/vendors/" + vendorId + "/commission")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.commissionPercentage").value(12.50));
    }
}
