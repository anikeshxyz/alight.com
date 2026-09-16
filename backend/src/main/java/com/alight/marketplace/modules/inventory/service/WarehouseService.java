package com.alight.marketplace.modules.inventory.service;

import com.alight.marketplace.modules.inventory.dto.CreateWarehouseRequest;
import com.alight.marketplace.modules.inventory.dto.UpdateWarehouseRequest;
import com.alight.marketplace.modules.inventory.dto.WarehouseDto;

import java.util.List;
import java.util.UUID;

public interface WarehouseService {

    List<WarehouseDto> getVendorWarehouses(String userEmail);

    WarehouseDto getVendorWarehouseById(UUID id, String userEmail);

    WarehouseDto createVendorWarehouse(CreateWarehouseRequest request, String userEmail);

    WarehouseDto updateVendorWarehouse(UUID id, UpdateWarehouseRequest request, String userEmail);

    void deleteVendorWarehouse(UUID id, String userEmail);

    // Admin Operations
    List<WarehouseDto> getAllWarehousesAdmin();

    WarehouseDto createPlatformWarehouseAdmin(CreateWarehouseRequest request);

    WarehouseDto updateWarehouseAdmin(UUID id, UpdateWarehouseRequest request);

    void deleteWarehouseAdmin(UUID id);
}
