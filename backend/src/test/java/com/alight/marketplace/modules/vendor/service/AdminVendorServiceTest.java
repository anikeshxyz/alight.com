package com.alight.marketplace.modules.vendor.service;

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
import com.alight.marketplace.modules.vendor.entity.VendorBusinessDetails;
import com.alight.marketplace.modules.vendor.entity.VendorStatus;
import com.alight.marketplace.modules.vendor.mapper.VendorMapper;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import com.alight.marketplace.modules.vendor.service.impl.AdminVendorServiceImpl;
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
class AdminVendorServiceTest {

    @Mock
    private VendorRepository vendorRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @Spy
    private VendorMapper vendorMapper = new VendorMapper();

    @InjectMocks
    private AdminVendorServiceImpl adminVendorService;

    private User sampleUser;
    private Vendor sampleVendor;

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
                .storeName("Top Gear Store")
                .slug("top-gear-store")
                .supportEmail("help@topgear.com")
                .supportPhone("+919988776655")
                .commissionPercentage(new BigDecimal("10.00"))
                .status(VendorStatus.PENDING_VERIFICATION)
                .businessDetails(VendorBusinessDetails.builder()
                        .legalBusinessName("Top Gear Ltd")
                        .verified(false)
                        .build())
                .build();
    }

    @Test
    @DisplayName("Should approve vendor and grant ROLE_VENDOR to user")
    void testApproveVendor() {
        Role vendorRole = Role.builder()
                .id(UUID.randomUUID())
                .name("ROLE_VENDOR")
                .build();

        when(vendorRepository.findById(sampleVendor.getId())).thenReturn(Optional.of(sampleVendor));
        when(vendorRepository.save(any(Vendor.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(roleRepository.findByName("ROLE_VENDOR")).thenReturn(Optional.of(vendorRole));

        UpdateVendorStatusRequest request = UpdateVendorStatusRequest.builder()
                .status(VendorStatus.APPROVED)
                .build();

        VendorResponseDto response = adminVendorService.updateVendorStatus(sampleVendor.getId(), request);

        assertNotNull(response);
        assertEquals(VendorStatus.APPROVED, response.getStatus());
        assertTrue(sampleVendor.getBusinessDetails().isVerified());
        assertTrue(sampleUser.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_VENDOR")));
        verify(userRepository, times(1)).save(sampleUser);
    }

    @Test
    @DisplayName("Should reject vendor when rejection reason is provided")
    void testRejectVendorWithReason() {
        when(vendorRepository.findById(sampleVendor.getId())).thenReturn(Optional.of(sampleVendor));
        when(vendorRepository.save(any(Vendor.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateVendorStatusRequest request = UpdateVendorStatusRequest.builder()
                .status(VendorStatus.REJECTED)
                .rejectionReason("Incomplete GSTIN documentation")
                .build();

        VendorResponseDto response = adminVendorService.updateVendorStatus(sampleVendor.getId(), request);

        assertNotNull(response);
        assertEquals(VendorStatus.REJECTED, response.getStatus());
        assertEquals("Incomplete GSTIN documentation", response.getRejectionReason());
    }

    @Test
    @DisplayName("Should throw exception when rejecting vendor without reason")
    void testRejectVendorWithoutReason() {
        when(vendorRepository.findById(sampleVendor.getId())).thenReturn(Optional.of(sampleVendor));

        UpdateVendorStatusRequest request = UpdateVendorStatusRequest.builder()
                .status(VendorStatus.REJECTED)
                .rejectionReason("   ")
                .build();

        assertThrows(BusinessRuleException.class, () ->
                adminVendorService.updateVendorStatus(sampleVendor.getId(), request)
        );
    }

    @Test
    @DisplayName("Should update vendor commission percentage")
    void testUpdateCommission() {
        when(vendorRepository.findById(sampleVendor.getId())).thenReturn(Optional.of(sampleVendor));
        when(vendorRepository.save(any(Vendor.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateCommissionRequest request = UpdateCommissionRequest.builder()
                .commissionPercentage(new BigDecimal("7.50"))
                .build();

        VendorResponseDto response = adminVendorService.updateCommission(sampleVendor.getId(), request);

        assertNotNull(response);
        assertEquals(new BigDecimal("7.50"), response.getCommissionPercentage());
    }
}
