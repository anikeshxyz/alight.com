package com.alight.marketplace.modules.vendor.service.impl;

import com.alight.marketplace.common.event.VendorStatusChangedEvent;
import com.alight.marketplace.common.exception.BusinessRuleException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.user.entity.Role;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.RoleRepository;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.dto.UpdateCommissionRequest;
import com.alight.marketplace.modules.vendor.dto.UpdateVendorStatusRequest;
import com.alight.marketplace.modules.vendor.dto.VendorResponseDto;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.entity.VendorStatus;
import com.alight.marketplace.modules.vendor.mapper.VendorMapper;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import com.alight.marketplace.modules.vendor.service.AdminVendorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminVendorServiceImpl implements AdminVendorService {

    private final VendorRepository vendorRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final VendorMapper vendorMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional(readOnly = true)
    public Page<VendorResponseDto> listVendors(VendorStatus status, String search, Pageable pageable) {
        Page<Vendor> vendors;
        if (search != null && !search.trim().isEmpty()) {
            vendors = vendorRepository.searchVendors(status, search.trim(), pageable);
        } else if (status != null) {
            vendors = vendorRepository.findByStatus(status, pageable);
        } else {
            vendors = vendorRepository.findAll(pageable);
        }

        return vendors.map(vendorMapper::toVendorResponseDto);
    }

    @Override
    @Transactional(readOnly = true)
    public VendorResponseDto getVendorById(UUID vendorId) {
        Vendor vendor = findVendorById(vendorId);
        return vendorMapper.toVendorResponseDto(vendor);
    }

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.alight.marketplace.modules.audit.service.AuditLogService auditLogService;

    @Override
    @Transactional
    public VendorResponseDto updateVendorStatus(UUID vendorId, UpdateVendorStatusRequest request) {
        Vendor vendor = findVendorById(vendorId);
        VendorStatus oldStatus = vendor.getStatus();
        VendorStatus newStatus = request.getStatus();

        if (newStatus == VendorStatus.REJECTED && (request.getRejectionReason() == null || request.getRejectionReason().trim().isEmpty())) {
            throw new BusinessRuleException("A rejection reason is required when rejecting a vendor application");
        }

        vendor.setStatus(newStatus);
        if (newStatus == VendorStatus.REJECTED) {
            vendor.setRejectionReason(request.getRejectionReason().trim());
        } else if (newStatus == VendorStatus.APPROVED) {
            vendor.setRejectionReason(null);
            if (vendor.getBusinessDetails() != null) {
                vendor.getBusinessDetails().setVerified(true);
            }
            assignVendorRole(vendor.getUser());
        }

        Vendor saved = vendorRepository.save(vendor);
        log.info("Admin updated vendor status to {} for vendor ID: {}", newStatus, vendorId);

        if (auditLogService != null) {
            auditLogService.recordEvent("VENDOR_STATUS_UPDATED", "VENDOR", vendorId.toString(),
                    "Status updated to: " + newStatus + (request.getRejectionReason() != null ? " (Reason: " + request.getRejectionReason() + ")" : ""));
        }

        // Publish VendorStatusChangedEvent via domain event bus
        eventPublisher.publishEvent(VendorStatusChangedEvent.builder()
                .vendorId(vendor.getId())
                .storeName(vendor.getStoreName())
                .oldStatus(oldStatus != null ? oldStatus.name() : "NONE")
                .newStatus(newStatus.name())
                .rejectionReason(vendor.getRejectionReason())
                .build());

        return vendorMapper.toVendorResponseDto(saved);
    }

    @Override
    @Transactional
    public VendorResponseDto updateCommission(UUID vendorId, UpdateCommissionRequest request) {
        Vendor vendor = findVendorById(vendorId);
        vendor.setCommissionPercentage(request.getCommissionPercentage());
        Vendor saved = vendorRepository.save(vendor);
        log.info("Admin updated commission to {}% for vendor ID: {}", request.getCommissionPercentage(), vendorId);

        if (auditLogService != null) {
            auditLogService.recordEvent("VENDOR_COMMISSION_UPDATED", "VENDOR", vendorId.toString(),
                    "Commission set to: " + request.getCommissionPercentage() + "%");
        }

        return vendorMapper.toVendorResponseDto(saved);
    }

    private Vendor findVendorById(UUID vendorId) {
        return vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with ID: " + vendorId));
    }

    private void assignVendorRole(User user) {
        if (user == null) return;
        boolean alreadyHasVendorRole = user.getRoles().stream()
                .anyMatch(r -> "ROLE_VENDOR".equalsIgnoreCase(r.getName()));

        if (!alreadyHasVendorRole) {
            Role vendorRole = roleRepository.findByName("ROLE_VENDOR")
                    .orElseGet(() -> roleRepository.save(Role.builder()
                            .name("ROLE_VENDOR")
                            .description("Vendor account for product management and order fulfillment")
                            .build()));
            user.getRoles().add(vendorRole);
            userRepository.save(user);
            log.info("Assigned ROLE_VENDOR to user ID: {}", user.getId());
        }
    }
}
