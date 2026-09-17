package com.alight.marketplace.modules.vendor.service;

import com.alight.marketplace.common.exception.BusinessRuleException;
import com.alight.marketplace.common.exception.DuplicateResourceException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.user.entity.Role;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.dto.*;
import com.alight.marketplace.modules.vendor.entity.BusinessType;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.entity.VendorBusinessDetails;
import com.alight.marketplace.modules.vendor.entity.VendorPickupAddress;
import com.alight.marketplace.modules.vendor.entity.VendorStatus;
import com.alight.marketplace.modules.vendor.mapper.VendorMapper;
import com.alight.marketplace.modules.vendor.repository.VendorBusinessDetailsRepository;
import com.alight.marketplace.modules.vendor.repository.VendorPickupAddressRepository;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import com.alight.marketplace.modules.vendor.service.impl.VendorServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VendorServiceTest {

    @Mock
    private VendorRepository vendorRepository;

    @Mock
    private VendorBusinessDetailsRepository businessDetailsRepository;

    @Mock
    private VendorPickupAddressRepository pickupAddressRepository;

    @Mock
    private UserRepository userRepository;

    @Spy
    private VendorMapper vendorMapper = new VendorMapper();

    @InjectMocks
    private VendorServiceImpl vendorService;

    private User sampleUser;
    private Vendor sampleVendor;
    private VendorBusinessDetails sampleBusinessDetails;
    private VendorPickupAddress samplePickupAddress;

    @BeforeEach
    void setUp() {
        Role customerRole = Role.builder()
                .id(UUID.randomUUID())
                .name("ROLE_CUSTOMER")
                .build();

        sampleUser = User.builder()
                .id(UUID.randomUUID())
                .email("seller@alight.com")
                .firstName("John")
                .lastName("Doe")
                .roles(new HashSet<>(Set.of(customerRole)))
                .build();

        sampleVendor = Vendor.builder()
                .id(UUID.randomUUID())
                .user(sampleUser)
                .storeName("Alight Direct Electronics")
                .slug("alight-direct-electronics")
                .description("Top grade electronics")
                .supportEmail("support@alightdirect.com")
                .supportPhone("+919876543210")
                .commissionPercentage(new BigDecimal("10.00"))
                .status(VendorStatus.PENDING_VERIFICATION)
                .build();

        sampleBusinessDetails = VendorBusinessDetails.builder()
                .id(UUID.randomUUID())
                .vendor(sampleVendor)
                .legalBusinessName("Alight Direct Retail Private Limited")
                .businessType(BusinessType.PRIVATE_LIMITED)
                .bankAccountNumber("123456789012")
                .bankIfscCode("HDFC0001234")
                .bankName("HDFC Bank")
                .bankAccountHolderName("Alight Direct Retail Pvt Ltd")
                .verified(false)
                .build();
        sampleVendor.setBusinessDetails(sampleBusinessDetails);

        samplePickupAddress = VendorPickupAddress.builder()
                .id(UUID.randomUUID())
                .vendor(sampleVendor)
                .contactPerson("John Doe")
                .contactPhone("+919876543210")
                .addressLine1("Plot 42, Industrial Area")
                .city("Bengaluru")
                .state("Karnataka")
                .postalCode("560066")
                .country("India")
                .primary(true)
                .build();
        sampleVendor.setPickupAddresses(new ArrayList<>(List.of(samplePickupAddress)));
    }

    @Test
    @DisplayName("Should successfully submit vendor application")
    void testApplyAsVendorSuccess() {
        VendorApplicationRequest request = VendorApplicationRequest.builder()
                .storeName("Alight Direct Electronics")
                .description("Top grade electronics")
                .supportEmail("support@alightdirect.com")
                .supportPhone("+919876543210")
                .legalBusinessName("Alight Direct Retail Private Limited")
                .businessType(BusinessType.PRIVATE_LIMITED)
                .bankAccountNumber("123456789012")
                .bankIfscCode("HDFC0001234")
                .bankName("HDFC Bank")
                .bankAccountHolderName("Alight Direct Retail Pvt Ltd")
                .pickupContactPerson("John Doe")
                .pickupContactPhone("+919876543210")
                .pickupAddressLine1("Plot 42, Industrial Area")
                .pickupCity("Bengaluru")
                .pickupState("Karnataka")
                .pickupPostalCode("560066")
                .pickupCountry("India")
                .build();

        when(userRepository.findByEmail("seller@alight.com")).thenReturn(Optional.of(sampleUser));
        when(vendorRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.empty());
        when(vendorRepository.existsByStoreName("Alight Direct Electronics")).thenReturn(false);
        when(vendorRepository.existsBySlug("alight-direct-electronics")).thenReturn(false);
        when(vendorRepository.save(any(Vendor.class))).thenReturn(sampleVendor);

        VendorResponseDto response = vendorService.applyAsVendor("seller@alight.com", request);

        assertNotNull(response);
        assertEquals("Alight Direct Electronics", response.getStoreName());
        assertEquals(VendorStatus.PENDING_VERIFICATION, response.getStatus());
        verify(vendorRepository, times(1)).save(any(Vendor.class));
    }

    @Test
    @DisplayName("Should throw exception when applying with duplicate store name")
    void testApplyDuplicateStoreName() {
        VendorApplicationRequest request = VendorApplicationRequest.builder()
                .storeName("Alight Direct Electronics")
                .build();

        when(userRepository.findByEmail("seller@alight.com")).thenReturn(Optional.of(sampleUser));
        when(vendorRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.empty());
        when(vendorRepository.existsByStoreName("Alight Direct Electronics")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () ->
                vendorService.applyAsVendor("seller@alight.com", request)
        );
    }

    @Test
    @DisplayName("Should retrieve current vendor profile")
    void testGetCurrentVendor() {
        when(vendorRepository.findByUserEmail("seller@alight.com")).thenReturn(Optional.of(sampleVendor));

        VendorResponseDto result = vendorService.getCurrentVendor("seller@alight.com");

        assertNotNull(result);
        assertEquals("Alight Direct Electronics", result.getStoreName());
        assertEquals("alight-direct-electronics", result.getSlug());
    }

    @Test
    @DisplayName("Should get approved public vendor store by slug")
    void testGetPublicStoreBySlug() {
        sampleVendor.setStatus(VendorStatus.APPROVED);
        when(vendorRepository.findBySlugAndStatus("alight-direct-electronics", VendorStatus.APPROVED))
                .thenReturn(Optional.of(sampleVendor));

        PublicVendorStoreDto store = vendorService.getPublicStoreBySlug("alight-direct-electronics");

        assertNotNull(store);
        assertEquals("Alight Direct Electronics", store.getStoreName());
    }

    @Test
    @DisplayName("Should throw exception when public store not found or not approved")
    void testGetPublicStoreNotFound() {
        when(vendorRepository.findBySlugAndStatus("non-existent", VendorStatus.APPROVED))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                vendorService.getPublicStoreBySlug("non-existent")
        );
    }
}
