package com.alight.marketplace.modules.vendor.service;

import com.alight.marketplace.modules.vendor.dto.UpdateCommissionRequest;
import com.alight.marketplace.modules.vendor.dto.UpdateVendorStatusRequest;
import com.alight.marketplace.modules.vendor.dto.VendorResponseDto;
import com.alight.marketplace.modules.vendor.entity.VendorStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface AdminVendorService {

    Page<VendorResponseDto> listVendors(VendorStatus status, String search, Pageable pageable);

    VendorResponseDto getVendorById(UUID vendorId);

    VendorResponseDto updateVendorStatus(UUID vendorId, UpdateVendorStatusRequest request);

    VendorResponseDto updateCommission(UUID vendorId, UpdateCommissionRequest request);
}
