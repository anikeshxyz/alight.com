package com.alight.marketplace.modules.returns.service;

import com.alight.marketplace.modules.returns.dto.*;
import com.alight.marketplace.modules.returns.entity.RmaStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface RmaService {

    // Customer Operations
    RmaResponseDto createRmaRequest(String userEmail, CreateRmaRequestDto dto);

    Page<RmaResponseDto> getMyReturns(String userEmail, Pageable pageable);

    RmaResponseDto getRmaByNumber(String rmaNumber, String userEmail);

    RmaResponseDto cancelRmaRequest(String rmaNumber, String userEmail);

    // Vendor Operations
    Page<RmaResponseDto> getVendorReturns(String vendorEmail, RmaStatus status, Pageable pageable);

    RmaResponseDto getVendorRmaById(UUID rmaId, String vendorEmail);

    RmaResponseDto reviewRmaByVendor(UUID rmaId, String vendorEmail, RmaReviewRequestDto dto);

    RmaResponseDto scheduleReversePickup(UUID rmaId, String vendorEmail, RmaSchedulePickupDto dto);

    RmaResponseDto inspectRmaItems(UUID rmaId, String vendorEmail, RmaInspectionRequestDto dto);

    RmaStatsSummaryDto getVendorRmaStats(String vendorEmail);

    // Admin Operations
    Page<RmaResponseDto> searchAllRmasAdmin(RmaStatus status, String searchTerm, Pageable pageable);

    RmaResponseDto getRmaByIdAdmin(UUID rmaId);

    RmaResponseDto adminOverrideRma(UUID rmaId, String adminEmail, RmaInspectionRequestDto dto);

    RmaStatsSummaryDto getAdminRmaStats();
}
