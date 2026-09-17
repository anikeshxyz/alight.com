package com.alight.marketplace.modules.vendor.service.impl;

import com.alight.marketplace.common.exception.BusinessRuleException;
import com.alight.marketplace.common.exception.DuplicateResourceException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.dto.*;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.entity.VendorBusinessDetails;
import com.alight.marketplace.modules.vendor.entity.VendorPickupAddress;
import com.alight.marketplace.modules.vendor.entity.VendorStatus;
import com.alight.marketplace.modules.vendor.mapper.VendorMapper;
import com.alight.marketplace.modules.vendor.repository.VendorBusinessDetailsRepository;
import com.alight.marketplace.modules.vendor.repository.VendorPickupAddressRepository;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import com.alight.marketplace.modules.vendor.service.VendorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class VendorServiceImpl implements VendorService {

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    private final VendorRepository vendorRepository;
    private final VendorBusinessDetailsRepository businessDetailsRepository;
    private final VendorPickupAddressRepository pickupAddressRepository;
    private final UserRepository userRepository;
    private final VendorMapper vendorMapper;

    @Override
    @Transactional
    public VendorResponseDto applyAsVendor(String userEmail, VendorApplicationRequest request) {
        User user = findUserByEmail(userEmail);
        String requestedStoreName = request.getStoreName().trim();

        java.util.Optional<Vendor> existingOpt = vendorRepository.findByUserId(user.getId());
        Vendor vendor;

        if (existingOpt.isPresent()) {
            vendor = existingOpt.get();
            if (!vendor.getStoreName().equalsIgnoreCase(requestedStoreName)) {
                if (vendorRepository.existsByStoreName(requestedStoreName)) {
                    throw new DuplicateResourceException("Store name is already taken: " + request.getStoreName());
                }
                vendor.setStoreName(requestedStoreName);
                vendor.setSlug(generateUniqueSlug(requestedStoreName));
            }
        } else {
            if (vendorRepository.existsByStoreName(requestedStoreName)) {
                throw new DuplicateResourceException("Store name is already taken: " + request.getStoreName());
            }
            String slug = generateUniqueSlug(requestedStoreName);
            vendor = Vendor.builder()
                    .user(user)
                    .storeName(requestedStoreName)
                    .slug(slug)
                    .commissionPercentage(new BigDecimal("10.00"))
                    .vacationMode(false)
                    .autoAcceptOrders(false)
                    .minimumOrderAmount(BigDecimal.ZERO)
                    .build();
        }

        vendor.setDescription(request.getDescription());
        vendor.setLogoUrl(request.getLogoUrl());
        vendor.setBannerUrl(request.getBannerUrl());
        vendor.setSupportEmail(request.getSupportEmail().trim().toLowerCase(Locale.ROOT));
        vendor.setSupportPhone(request.getSupportPhone().trim());
        vendor.setStatus(VendorStatus.PENDING_VERIFICATION);
        vendor.setOnboardingStep("STEP_5_COMPLETED");
        vendor.setRejectionReason(null);

        VendorBusinessDetails businessDetails = vendor.getBusinessDetails();
        if (businessDetails == null) {
            businessDetails = VendorBusinessDetails.builder().vendor(vendor).build();
        }
        businessDetails.setLegalBusinessName(request.getLegalBusinessName().trim());
        businessDetails.setBusinessType(request.getBusinessType());
        businessDetails.setTaxIdGstin(request.getTaxIdGstin() != null ? request.getTaxIdGstin().trim() : null);
        businessDetails.setPanNumber(request.getPanNumber() != null ? request.getPanNumber().trim() : null);
        businessDetails.setBankAccountNumber(request.getBankAccountNumber().trim());
        businessDetails.setBankIfscCode(request.getBankIfscCode().trim().toUpperCase(Locale.ROOT));
        businessDetails.setBankName(request.getBankName().trim());
        businessDetails.setBankAccountHolderName(request.getBankAccountHolderName().trim());
        businessDetails.setVerified(false);
        vendor.setBusinessDetails(businessDetails);

        VendorPickupAddress pickupAddress = VendorPickupAddress.builder()
                .vendor(vendor)
                .contactPerson(request.getPickupContactPerson().trim())
                .contactPhone(request.getPickupContactPhone().trim())
                .addressLine1(request.getPickupAddressLine1().trim())
                .addressLine2(request.getPickupAddressLine2() != null ? request.getPickupAddressLine2().trim() : null)
                .city(request.getPickupCity().trim())
                .state(request.getPickupState().trim())
                .postalCode(request.getPickupPostalCode().trim())
                .country(request.getPickupCountry() != null ? request.getPickupCountry().trim() : "India")
                .primary(true)
                .build();

        if (vendor.getPickupAddresses() == null) {
            vendor.setPickupAddresses(new ArrayList<>());
        }
        vendor.getPickupAddresses().clear();
        vendor.getPickupAddresses().add(pickupAddress);

        Vendor saved = vendorRepository.save(vendor);
        log.info("Vendor application submitted successfully for user: {}, vendor ID: {}", userEmail, saved.getId());
        return vendorMapper.toVendorResponseDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public VendorResponseDto getCurrentVendor(String userEmail) {
        Vendor vendor = findVendorByUserEmail(userEmail);
        return vendorMapper.toVendorResponseDto(vendor);
    }

    @Override
    @Transactional
    public VendorResponseDto updateVendorProfile(String userEmail, UpdateVendorProfileRequest request) {
        Vendor vendor = findVendorByUserEmail(userEmail);

        if (!vendor.getStoreName().equalsIgnoreCase(request.getStoreName().trim())) {
            if (vendorRepository.existsByStoreName(request.getStoreName().trim())) {
                throw new DuplicateResourceException("Store name is already taken: " + request.getStoreName());
            }
            vendor.setStoreName(request.getStoreName().trim());
            vendor.setSlug(generateUniqueSlug(request.getStoreName()));
        }

        vendor.setDescription(request.getDescription());
        vendor.setLogoUrl(request.getLogoUrl());
        vendor.setBannerUrl(request.getBannerUrl());
        vendor.setSupportEmail(request.getSupportEmail().trim().toLowerCase(Locale.ROOT));
        vendor.setSupportPhone(request.getSupportPhone().trim());

        Vendor saved = vendorRepository.save(vendor);
        log.info("Updated vendor store profile for vendor ID: {}", saved.getId());
        return vendorMapper.toVendorResponseDto(saved);
    }

    @Override
    @Transactional
    public VendorResponseDto updateStoreSettings(String userEmail, UpdateStoreSettingsRequest request) {
        Vendor vendor = findVendorByUserEmail(userEmail);

        vendor.setVacationMode(request.isVacationMode());
        vendor.setVacationMessage(request.getVacationMessage());
        vendor.setShippingPolicy(request.getShippingPolicy());
        vendor.setRefundPolicy(request.getRefundPolicy());
        vendor.setPrivacyPolicy(request.getPrivacyPolicy());
        vendor.setCustomDomain(request.getCustomDomain());
        vendor.setAutoAcceptOrders(request.isAutoAcceptOrders());
        if (request.getMinimumOrderAmount() != null) {
            vendor.setMinimumOrderAmount(request.getMinimumOrderAmount());
        }

        Vendor saved = vendorRepository.save(vendor);
        log.info("Updated store settings & policies for vendor ID: {}", saved.getId());
        return vendorMapper.toVendorResponseDto(saved);
    }

    @Override
    @Transactional
    public VendorBusinessDetailsDto updateBusinessDetails(String userEmail, UpdateBusinessDetailsRequest request) {
        Vendor vendor = findVendorByUserEmail(userEmail);
        VendorBusinessDetails details = businessDetailsRepository.findByVendorId(vendor.getId())
                .orElseGet(() -> VendorBusinessDetails.builder().vendor(vendor).build());

        details.setLegalBusinessName(request.getLegalBusinessName().trim());
        details.setBusinessType(request.getBusinessType());
        details.setTaxIdGstin(request.getTaxIdGstin() != null ? request.getTaxIdGstin().trim() : null);
        details.setPanNumber(request.getPanNumber() != null ? request.getPanNumber().trim() : null);
        details.setBankAccountNumber(request.getBankAccountNumber().trim());
        details.setBankIfscCode(request.getBankIfscCode().trim().toUpperCase(Locale.ROOT));
        details.setBankName(request.getBankName().trim());
        details.setBankAccountHolderName(request.getBankAccountHolderName().trim());

        VendorBusinessDetails saved = businessDetailsRepository.save(details);
        log.info("Updated business and banking details for vendor ID: {}", vendor.getId());
        return vendorMapper.toBusinessDetailsDto(saved);
    }

    @Override
    @Transactional
    public VendorBusinessDetailsDto updateKycDocuments(String userEmail, UpdateKycDocumentsRequest request) {
        Vendor vendor = findVendorByUserEmail(userEmail);
        VendorBusinessDetails details = businessDetailsRepository.findByVendorId(vendor.getId())
                .orElseGet(() -> {
                    VendorBusinessDetails newDetails = VendorBusinessDetails.builder().vendor(vendor).build();
                    vendor.setBusinessDetails(newDetails);
                    return newDetails;
                });

        if (request.getBusinessLicenseUrl() != null && !request.getBusinessLicenseUrl().trim().isEmpty()) {
            details.setBusinessLicenseUrl(request.getBusinessLicenseUrl().trim());
        }
        if (request.getTaxCertificateUrl() != null && !request.getTaxCertificateUrl().trim().isEmpty()) {
            details.setTaxCertificateUrl(request.getTaxCertificateUrl().trim());
        }
        if (request.getIdProofUrl() != null && !request.getIdProofUrl().trim().isEmpty()) {
            details.setIdProofUrl(request.getIdProofUrl().trim());
        }

        // If vendor was previously rejected or draft, re-submission moves them back to PENDING_VERIFICATION
        if (vendor.getStatus() == VendorStatus.REJECTED || vendor.getStatus() == VendorStatus.DRAFT) {
            vendor.setStatus(VendorStatus.PENDING_VERIFICATION);
            vendor.setRejectionReason(null);
            vendorRepository.save(vendor);
        }

        VendorBusinessDetails saved = businessDetailsRepository.save(details);
        log.info("Updated KYC verification documents for vendor ID: {}", vendor.getId());
        return vendorMapper.toBusinessDetailsDto(saved);
    }

    @Override
    @Transactional
    public VendorResponseDto toggleVacationMode(String userEmail, boolean vacationMode, String vacationMessage) {
        Vendor vendor = findVendorByUserEmail(userEmail);
        vendor.setVacationMode(vacationMode);
        vendor.setVacationMessage(vacationMode ? vacationMessage : null);

        Vendor saved = vendorRepository.save(vendor);
        log.info("Vendor ID: {} toggled vacation mode to {}", saved.getId(), vacationMode);
        return vendorMapper.toVendorResponseDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VendorPickupAddressDto> getPickupAddresses(String userEmail) {
        Vendor vendor = findVendorByUserEmail(userEmail);
        return pickupAddressRepository.findByVendorId(vendor.getId())
                .stream()
                .map(vendorMapper::toPickupAddressDto)
                .toList();
    }

    @Override
    @Transactional
    public VendorPickupAddressDto addPickupAddress(String userEmail, CreatePickupAddressRequest request) {
        Vendor vendor = findVendorByUserEmail(userEmail);

        if (request.isPrimary()) {
            clearPrimaryPickupAddresses(vendor.getId());
        }

        VendorPickupAddress address = VendorPickupAddress.builder()
                .vendor(vendor)
                .contactPerson(request.getContactPerson().trim())
                .contactPhone(request.getContactPhone().trim())
                .addressLine1(request.getAddressLine1().trim())
                .addressLine2(request.getAddressLine2() != null ? request.getAddressLine2().trim() : null)
                .city(request.getCity().trim())
                .state(request.getState().trim())
                .postalCode(request.getPostalCode().trim())
                .country(request.getCountry() != null ? request.getCountry().trim() : "India")
                .primary(request.isPrimary())
                .build();

        VendorPickupAddress saved = pickupAddressRepository.save(address);
        log.info("Added pickup address {} for vendor ID: {}", saved.getId(), vendor.getId());
        return vendorMapper.toPickupAddressDto(saved);
    }

    @Override
    @Transactional
    public VendorPickupAddressDto setPrimaryPickupAddress(String userEmail, UUID addressId) {
        Vendor vendor = findVendorByUserEmail(userEmail);
        VendorPickupAddress address = pickupAddressRepository.findByIdAndVendorId(addressId, vendor.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Pickup address not found for vendor"));

        clearPrimaryPickupAddresses(vendor.getId());
        address.setPrimary(true);
        VendorPickupAddress saved = pickupAddressRepository.save(address);
        log.info("Set primary pickup address {} for vendor ID: {}", addressId, vendor.getId());
        return vendorMapper.toPickupAddressDto(saved);
    }

    @Override
    @Transactional
    public void deletePickupAddress(String userEmail, UUID addressId) {
        Vendor vendor = findVendorByUserEmail(userEmail);
        VendorPickupAddress address = pickupAddressRepository.findByIdAndVendorId(addressId, vendor.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Pickup address not found for vendor"));

        List<VendorPickupAddress> addresses = pickupAddressRepository.findByVendorId(vendor.getId());
        if (addresses.size() <= 1) {
            throw new BusinessRuleException("Cannot delete the only remaining pickup address");
        }

        pickupAddressRepository.delete(address);

        if (address.isPrimary()) {
            addresses.stream()
                    .filter(a -> !a.getId().equals(addressId))
                    .findFirst()
                    .ifPresent(nextPrimary -> {
                        nextPrimary.setPrimary(true);
                        pickupAddressRepository.save(nextPrimary);
                    });
        }
        log.info("Deleted pickup address {} for vendor ID: {}", addressId, vendor.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public PublicVendorStoreDto getPublicStoreBySlug(String slug) {
        Vendor vendor = vendorRepository.findBySlugAndStatus(slug, VendorStatus.APPROVED)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor store not found or not currently active"));

        return vendorMapper.toPublicVendorStoreDto(vendor);
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private Vendor findVendorByUserEmail(String email) {
        return vendorRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor account not found for user: " + email));
    }

    private void clearPrimaryPickupAddresses(UUID vendorId) {
        List<VendorPickupAddress> addresses = pickupAddressRepository.findByVendorId(vendorId);
        for (VendorPickupAddress addr : addresses) {
            if (addr.isPrimary()) {
                addr.setPrimary(false);
                pickupAddressRepository.save(addr);
            }
        }
    }

    private String generateUniqueSlug(String storeName) {
        String nowhitespace = WHITESPACE.matcher(storeName).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("").toLowerCase(Locale.ENGLISH);

        if (slug.isEmpty()) {
            slug = "vendor-" + UUID.randomUUID().toString().substring(0, 8);
        }

        String baseSlug = slug;
        int count = 1;
        while (vendorRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + count++;
        }
        return slug;
    }
}
