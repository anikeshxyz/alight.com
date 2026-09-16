package com.alight.marketplace.modules.vendor;

import com.alight.marketplace.common.exception.BusinessRuleException;
import com.alight.marketplace.common.exception.DuplicateResourceException;
import com.alight.marketplace.modules.auth.dto.RegisterRequest;
import com.alight.marketplace.modules.auth.service.AuthService;
import com.alight.marketplace.modules.vendor.dto.*;
import com.alight.marketplace.modules.vendor.entity.BusinessType;
import com.alight.marketplace.modules.vendor.entity.VendorStatus;
import com.alight.marketplace.modules.vendor.service.AdminVendorService;
import com.alight.marketplace.modules.vendor.service.VendorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("default")
@Transactional
class VendorManagementIntegrationTest {

    @Autowired
    private VendorService vendorService;

    @Autowired
    private AdminVendorService adminVendorService;

    @Autowired
    private AuthService authService;

    private String testUserEmail;
    private String storeName;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        testUserEmail = "seller_" + suffix + "@alight.com";
        storeName = "Global Crafts " + suffix;

        authService.register(RegisterRequest.builder()
                .email(testUserEmail)
                .password("SecurePassword123!")
                .firstName("Global")
                .lastName("Seller")
                .phone("+1555" + suffix.substring(0, 6))
                .accountType("VENDOR")
                .build());
    }

    private VendorApplicationRequest buildSampleApplication(String storeName) {
        return VendorApplicationRequest.builder()
                .storeName(storeName)
                .description("Handmade and premium artisan items")
                .supportEmail(testUserEmail)
                .supportPhone("+15559876543")
                .legalBusinessName("Global Crafts LLC")
                .businessType(BusinessType.PRIVATE_LIMITED)
                .taxIdGstin("27AAAAA0000A1Z5")
                .panNumber("ABCDE1234F")
                .bankAccountNumber("123456789012")
                .bankIfscCode("HDFC0001234")
                .bankName("HDFC Bank")
                .bankAccountHolderName("Global Crafts LLC")
                .pickupContactPerson("Warehouse Manager")
                .pickupContactPhone("+15559876543")
                .pickupAddressLine1("123 Innovation Boulevard")
                .pickupCity("Mumbai")
                .pickupState("Maharashtra")
                .pickupPostalCode("400001")
                .pickupCountry("India")
                .build();
    }

    @Test
    @DisplayName("Should submit vendor application and establish multi-tenancy store baseline")
    void testVendorApplication() {
        VendorResponseDto vendor = vendorService.applyAsVendor(testUserEmail, buildSampleApplication(storeName));

        assertNotNull(vendor);
        assertNotNull(vendor.getId());
        assertEquals(storeName, vendor.getStoreName());
        assertEquals(VendorStatus.PENDING_VERIFICATION, vendor.getStatus());
        assertEquals(new BigDecimal("10.00"), vendor.getCommissionPercentage());
        assertFalse(vendor.isVacationMode());
        assertNotNull(vendor.getBusinessDetails());
        assertEquals("Global Crafts LLC", vendor.getBusinessDetails().getLegalBusinessName());
        assertNotNull(vendor.getPickupAddresses());
        assertEquals(1, vendor.getPickupAddresses().size());
        assertTrue(vendor.getPickupAddresses().get(0).isPrimary());

        // Duplicate application must be rejected
        assertThrows(DuplicateResourceException.class, () ->
                vendorService.applyAsVendor(testUserEmail, buildSampleApplication(storeName + " 2")));
    }

    @Test
    @DisplayName("Should update store settings, policies, and custom domain")
    void testUpdateStoreSettings() {
        vendorService.applyAsVendor(testUserEmail, buildSampleApplication(storeName));

        UpdateStoreSettingsRequest settings = UpdateStoreSettingsRequest.builder()
                .shippingPolicy("Free express shipping on all orders over $50")
                .refundPolicy("30-day money-back guarantee")
                .privacyPolicy("We protect all customer transactional data")
                .customDomain("crafts.alightmarketplace.com")
                .autoAcceptOrders(true)
                .minimumOrderAmount(new BigDecimal("25.00"))
                .vacationMode(false)
                .build();

        VendorResponseDto updated = vendorService.updateStoreSettings(testUserEmail, settings);

        assertEquals("Free express shipping on all orders over $50", updated.getShippingPolicy());
        assertEquals("30-day money-back guarantee", updated.getRefundPolicy());
        assertEquals("crafts.alightmarketplace.com", updated.getCustomDomain());
        assertTrue(updated.isAutoAcceptOrders());
        assertEquals(new BigDecimal("25.00"), updated.getMinimumOrderAmount());
    }

    @Test
    @DisplayName("Should update KYC verification documents")
    void testUpdateKycDocuments() {
        vendorService.applyAsVendor(testUserEmail, buildSampleApplication(storeName));

        UpdateKycDocumentsRequest kycRequest = UpdateKycDocumentsRequest.builder()
                .businessLicenseUrl("https://s3.alight.com/docs/license_123.pdf")
                .taxCertificateUrl("https://s3.alight.com/docs/tax_cert_123.pdf")
                .idProofUrl("https://s3.alight.com/docs/passport_123.pdf")
                .build();

        VendorBusinessDetailsDto details = vendorService.updateKycDocuments(testUserEmail, kycRequest);

        assertNotNull(details);
        assertEquals("https://s3.alight.com/docs/license_123.pdf", details.getBusinessLicenseUrl());
        assertEquals("https://s3.alight.com/docs/tax_cert_123.pdf", details.getTaxCertificateUrl());
        assertEquals("https://s3.alight.com/docs/passport_123.pdf", details.getIdProofUrl());
    }

    @Test
    @DisplayName("Should toggle vacation mode on and off with custom customer notice")
    void testToggleVacationMode() {
        vendorService.applyAsVendor(testUserEmail, buildSampleApplication(storeName));

        VendorResponseDto onVacation = vendorService.toggleVacationMode(testUserEmail, true, "Away for holiday maintenance until Monday");
        assertTrue(onVacation.isVacationMode());
        assertEquals("Away for holiday maintenance until Monday", onVacation.getVacationMessage());

        VendorResponseDto backFromVacation = vendorService.toggleVacationMode(testUserEmail, false, null);
        assertFalse(backFromVacation.isVacationMode());
        assertNull(backFromVacation.getVacationMessage());
    }

    @Test
    @DisplayName("Should handle Admin KYC review, approval, role promotion, and rejection")
    void testAdminModerationWorkflow() {
        VendorResponseDto vendor = vendorService.applyAsVendor(testUserEmail, buildSampleApplication(storeName));

        // 1. Rejection without reason fails
        assertThrows(BusinessRuleException.class, () ->
                adminVendorService.updateVendorStatus(vendor.getId(), UpdateVendorStatusRequest.builder()
                        .status(VendorStatus.REJECTED)
                        .rejectionReason("")
                        .build()));

        // 2. Approve application
        VendorResponseDto approved = adminVendorService.updateVendorStatus(vendor.getId(), UpdateVendorStatusRequest.builder()
                .status(VendorStatus.APPROVED)
                .build());

        assertEquals(VendorStatus.APPROVED, approved.getStatus());
        assertTrue(approved.getBusinessDetails().isVerified());

        // 3. Admin can update custom commission tier
        VendorResponseDto commUpdated = adminVendorService.updateCommission(vendor.getId(), UpdateCommissionRequest.builder()
                .commissionPercentage(new BigDecimal("7.50"))
                .build());
        assertEquals(new BigDecimal("7.50"), commUpdated.getCommissionPercentage());

        // 4. Public storefront slug lookup works for approved vendor
        PublicVendorStoreDto publicStore = vendorService.getPublicStoreBySlug(vendor.getSlug());
        assertNotNull(publicStore);
        assertEquals(storeName, publicStore.getStoreName());
    }
}
