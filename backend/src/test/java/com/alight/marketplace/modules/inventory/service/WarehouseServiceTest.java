package com.alight.marketplace.modules.inventory.service;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.modules.inventory.dto.CreateWarehouseRequest;
import com.alight.marketplace.modules.inventory.dto.WarehouseDto;
import com.alight.marketplace.modules.inventory.entity.Warehouse;
import com.alight.marketplace.modules.inventory.repository.WarehouseRepository;
import com.alight.marketplace.modules.inventory.service.impl.WarehouseServiceImpl;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WarehouseServiceTest {

    @Mock
    private WarehouseRepository warehouseRepository;

    @Mock
    private VendorRepository vendorRepository;

    @InjectMocks
    private WarehouseServiceImpl warehouseService;

    private Vendor testVendor;
    private Warehouse testWarehouse;

    @BeforeEach
    void setUp() {
        testVendor = Vendor.builder()
                .id(UUID.randomUUID())
                .storeName("Alight Hardware")
                .slug("alight-hardware")
                .build();

        testWarehouse = Warehouse.builder()
                .id(UUID.randomUUID())
                .vendor(testVendor)
                .name("Delhi Hub")
                .code("WH-DEL-01")
                .addressLine1("Plot 42")
                .city("Gurugram")
                .state("Haryana")
                .postalCode("122001")
                .countryCode("IN")
                .active(true)
                .primary(true)
                .build();
    }

    @Test
    @DisplayName("getVendorWarehouses returns list of vendor warehouses")
    void testGetVendorWarehouses() {
        when(vendorRepository.findByUserEmail("seller@alight.com")).thenReturn(Optional.of(testVendor));
        when(warehouseRepository.findByVendorId(testVendor.getId())).thenReturn(List.of(testWarehouse));

        List<WarehouseDto> result = warehouseService.getVendorWarehouses("seller@alight.com");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCode()).isEqualTo("WH-DEL-01");
        assertThat(result.get(0).getCity()).isEqualTo("Gurugram");
    }

    @Test
    @DisplayName("createVendorWarehouse successfully creates warehouse")
    void testCreateVendorWarehouse() {
        CreateWarehouseRequest req = CreateWarehouseRequest.builder()
                .name("Mumbai Hub")
                .code("WH-MUM-01")
                .addressLine1("Unit 10")
                .city("Mumbai")
                .state("Maharashtra")
                .postalCode("400001")
                .active(true)
                .primary(false)
                .build();

        when(vendorRepository.findByUserEmail("seller@alight.com")).thenReturn(Optional.of(testVendor));
        when(warehouseRepository.existsByCode("WH-MUM-01")).thenReturn(false);
        when(warehouseRepository.save(any(Warehouse.class))).thenAnswer(inv -> {
            Warehouse w = inv.getArgument(0);
            w.setId(UUID.randomUUID());
            return w;
        });

        WarehouseDto result = warehouseService.createVendorWarehouse(req, "seller@alight.com");

        assertThat(result.getName()).isEqualTo("Mumbai Hub");
        assertThat(result.getCode()).isEqualTo("WH-MUM-01");
    }

    @Test
    @DisplayName("createVendorWarehouse throws error on duplicate code")
    void testCreateDuplicateCode() {
        CreateWarehouseRequest req = CreateWarehouseRequest.builder()
                .name("Duplicate Hub")
                .code("WH-DEL-01")
                .addressLine1("Addr")
                .city("City")
                .state("State")
                .postalCode("123456")
                .build();

        when(vendorRepository.findByUserEmail("seller@alight.com")).thenReturn(Optional.of(testVendor));
        when(warehouseRepository.existsByCode("WH-DEL-01")).thenReturn(true);

        assertThatThrownBy(() -> warehouseService.createVendorWarehouse(req, "seller@alight.com"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already in use");
    }
}
