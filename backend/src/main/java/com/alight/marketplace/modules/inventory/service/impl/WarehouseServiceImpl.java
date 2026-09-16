package com.alight.marketplace.modules.inventory.service.impl;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.common.exception.UnauthorizedException;
import com.alight.marketplace.modules.inventory.dto.CreateWarehouseRequest;
import com.alight.marketplace.modules.inventory.dto.UpdateWarehouseRequest;
import com.alight.marketplace.modules.inventory.dto.WarehouseDto;
import com.alight.marketplace.modules.inventory.entity.Warehouse;
import com.alight.marketplace.modules.inventory.repository.WarehouseRepository;
import com.alight.marketplace.modules.inventory.service.WarehouseService;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WarehouseServiceImpl implements WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final VendorRepository vendorRepository;

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseDto> getVendorWarehouses(String userEmail) {
        Vendor vendor = getVendorForUser(userEmail);
        return warehouseRepository.findByVendorId(vendor.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public WarehouseDto getVendorWarehouseById(UUID id, String userEmail) {
        Vendor vendor = getVendorForUser(userEmail);
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with ID: " + id));

        if (warehouse.getVendor() == null || !warehouse.getVendor().getId().equals(vendor.getId())) {
            throw new UnauthorizedException("You do not have permission to access this warehouse");
        }

        return mapToDto(warehouse);
    }

    @Override
    @Transactional
    public WarehouseDto createVendorWarehouse(CreateWarehouseRequest request, String userEmail) {
        Vendor vendor = getVendorForUser(userEmail);

        if (warehouseRepository.existsByCode(request.getCode().trim().toUpperCase())) {
            throw new BadRequestException("Warehouse code '" + request.getCode() + "' is already in use");
        }

        if (request.isPrimary()) {
            clearPrimaryForVendor(vendor.getId());
        }

        Warehouse warehouse = Warehouse.builder()
                .vendor(vendor)
                .name(request.getName().trim())
                .code(request.getCode().trim().toUpperCase())
                .contactName(request.getContactName())
                .contactPhone(request.getContactPhone())
                .contactEmail(request.getContactEmail())
                .addressLine1(request.getAddressLine1().trim())
                .addressLine2(request.getAddressLine2())
                .city(request.getCity().trim())
                .state(request.getState().trim())
                .postalCode(request.getPostalCode().trim())
                .countryCode(request.getCountryCode() != null ? request.getCountryCode() : "IN")
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .active(request.isActive())
                .primary(request.isPrimary())
                .build();

        Warehouse saved = warehouseRepository.save(warehouse);
        log.info("Created warehouse {} ({}) for vendor {}", saved.getName(), saved.getCode(), vendor.getStoreName());
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public WarehouseDto updateVendorWarehouse(UUID id, UpdateWarehouseRequest request, String userEmail) {
        Vendor vendor = getVendorForUser(userEmail);
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with ID: " + id));

        if (warehouse.getVendor() == null || !warehouse.getVendor().getId().equals(vendor.getId())) {
            throw new UnauthorizedException("You do not have permission to modify this warehouse");
        }

        if (request.getPrimary() != null && request.getPrimary()) {
            clearPrimaryForVendor(vendor.getId());
            warehouse.setPrimary(true);
        } else if (request.getPrimary() != null) {
            warehouse.setPrimary(request.getPrimary());
        }

        if (request.getName() != null) warehouse.setName(request.getName().trim());
        if (request.getContactName() != null) warehouse.setContactName(request.getContactName());
        if (request.getContactPhone() != null) warehouse.setContactPhone(request.getContactPhone());
        if (request.getContactEmail() != null) warehouse.setContactEmail(request.getContactEmail());
        if (request.getAddressLine1() != null) warehouse.setAddressLine1(request.getAddressLine1().trim());
        if (request.getAddressLine2() != null) warehouse.setAddressLine2(request.getAddressLine2());
        if (request.getCity() != null) warehouse.setCity(request.getCity().trim());
        if (request.getState() != null) warehouse.setState(request.getState().trim());
        if (request.getPostalCode() != null) warehouse.setPostalCode(request.getPostalCode().trim());
        if (request.getCountryCode() != null) warehouse.setCountryCode(request.getCountryCode());
        if (request.getLatitude() != null) warehouse.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) warehouse.setLongitude(request.getLongitude());
        if (request.getActive() != null) warehouse.setActive(request.getActive());

        Warehouse updated = warehouseRepository.save(warehouse);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public void deleteVendorWarehouse(UUID id, String userEmail) {
        Vendor vendor = getVendorForUser(userEmail);
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with ID: " + id));

        if (warehouse.getVendor() == null || !warehouse.getVendor().getId().equals(vendor.getId())) {
            throw new UnauthorizedException("You do not have permission to delete this warehouse");
        }

        warehouseRepository.delete(warehouse);
        log.info("Deleted warehouse ID: {} for vendor {}", id, vendor.getStoreName());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseDto> getAllWarehousesAdmin() {
        return warehouseRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public WarehouseDto createPlatformWarehouseAdmin(CreateWarehouseRequest request) {
        if (warehouseRepository.existsByCode(request.getCode().trim().toUpperCase())) {
            throw new BadRequestException("Warehouse code '" + request.getCode() + "' is already in use");
        }

        Warehouse warehouse = Warehouse.builder()
                .vendor(null) // Platform owned
                .name(request.getName().trim())
                .code(request.getCode().trim().toUpperCase())
                .contactName(request.getContactName())
                .contactPhone(request.getContactPhone())
                .contactEmail(request.getContactEmail())
                .addressLine1(request.getAddressLine1().trim())
                .addressLine2(request.getAddressLine2())
                .city(request.getCity().trim())
                .state(request.getState().trim())
                .postalCode(request.getPostalCode().trim())
                .countryCode(request.getCountryCode() != null ? request.getCountryCode() : "IN")
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .active(request.isActive())
                .primary(request.isPrimary())
                .build();

        return mapToDto(warehouseRepository.save(warehouse));
    }

    @Override
    @Transactional
    public WarehouseDto updateWarehouseAdmin(UUID id, UpdateWarehouseRequest request) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with ID: " + id));

        if (request.getName() != null) warehouse.setName(request.getName().trim());
        if (request.getContactName() != null) warehouse.setContactName(request.getContactName());
        if (request.getContactPhone() != null) warehouse.setContactPhone(request.getContactPhone());
        if (request.getContactEmail() != null) warehouse.setContactEmail(request.getContactEmail());
        if (request.getAddressLine1() != null) warehouse.setAddressLine1(request.getAddressLine1().trim());
        if (request.getAddressLine2() != null) warehouse.setAddressLine2(request.getAddressLine2());
        if (request.getCity() != null) warehouse.setCity(request.getCity().trim());
        if (request.getState() != null) warehouse.setState(request.getState().trim());
        if (request.getPostalCode() != null) warehouse.setPostalCode(request.getPostalCode().trim());
        if (request.getCountryCode() != null) warehouse.setCountryCode(request.getCountryCode());
        if (request.getLatitude() != null) warehouse.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) warehouse.setLongitude(request.getLongitude());
        if (request.getActive() != null) warehouse.setActive(request.getActive());
        if (request.getPrimary() != null) warehouse.setPrimary(request.getPrimary());

        return mapToDto(warehouseRepository.save(warehouse));
    }

    @Override
    @Transactional
    public void deleteWarehouseAdmin(UUID id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with ID: " + id));
        warehouseRepository.delete(warehouse);
    }

    private void clearPrimaryForVendor(UUID vendorId) {
        warehouseRepository.findByVendorIdAndPrimaryTrue(vendorId)
                .ifPresent(w -> {
                    w.setPrimary(false);
                    warehouseRepository.save(w);
                });
    }

    private Vendor getVendorForUser(String userEmail) {
        return vendorRepository.findByUserEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor account not found for user: " + userEmail));
    }

    private WarehouseDto mapToDto(Warehouse w) {
        return WarehouseDto.builder()
                .id(w.getId())
                .vendorId(w.getVendor() != null ? w.getVendor().getId() : null)
                .vendorStoreName(w.getVendor() != null ? w.getVendor().getStoreName() : "Alight Platform Fulfillment")
                .name(w.getName())
                .code(w.getCode())
                .contactName(w.getContactName())
                .contactPhone(w.getContactPhone())
                .contactEmail(w.getContactEmail())
                .addressLine1(w.getAddressLine1())
                .addressLine2(w.getAddressLine2())
                .city(w.getCity())
                .state(w.getState())
                .postalCode(w.getPostalCode())
                .countryCode(w.getCountryCode())
                .latitude(w.getLatitude())
                .longitude(w.getLongitude())
                .active(w.isActive())
                .primary(w.isPrimary())
                .createdAt(w.getCreatedAt())
                .updatedAt(w.getUpdatedAt())
                .build();
    }
}
