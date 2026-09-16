package com.alight.marketplace.modules.user.service;

import com.alight.marketplace.modules.user.dto.AddressDto;
import com.alight.marketplace.modules.user.dto.CreateAddressRequest;
import com.alight.marketplace.modules.user.dto.UpdateProfileRequest;
import com.alight.marketplace.modules.user.dto.UserProfileDto;
import com.alight.marketplace.modules.user.entity.Role;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.entity.UserAddress;
import com.alight.marketplace.modules.user.repository.UserAddressRepository;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.user.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserAddressRepository addressRepository;

    @InjectMocks
    private UserServiceImpl userService;

    private User sampleUser;
    private UserAddress sampleAddress;

    @BeforeEach
    void setUp() {
        Role customerRole = Role.builder()
                .id(UUID.randomUUID())
                .name("ROLE_CUSTOMER")
                .build();

        sampleUser = User.builder()
                .id(UUID.randomUUID())
                .email("user@alight.com")
                .firstName("Jane")
                .lastName("Smith")
                .phone("+919876543210")
                .active(true)
                .roles(new HashSet<>(Set.of(customerRole)))
                .build();

        sampleAddress = UserAddress.builder()
                .id(UUID.randomUUID())
                .userId(sampleUser.getId())
                .recipientName("Jane Smith")
                .phone("+919876543210")
                .addressLine1("123 MG Road")
                .city("Bengaluru")
                .state("Karnataka")
                .postalCode("560001")
                .country("India")
                .isDefault(true)
                .addressType("HOME")
                .build();
    }

    @Test
    @DisplayName("Should get user profile by email")
    void testGetUserProfile() {
        when(userRepository.findByEmail("user@alight.com")).thenReturn(Optional.of(sampleUser));

        UserProfileDto profile = userService.getCurrentUserProfile("user@alight.com");

        assertNotNull(profile);
        assertEquals("user@alight.com", profile.getEmail());
        assertEquals("Jane", profile.getFirstName());
        assertEquals("Smith", profile.getLastName());
    }

    @Test
    @DisplayName("Should update user profile")
    void testUpdateUserProfile() {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .firstName("Janet")
                .lastName("Smithson")
                .phone("+919999999999")
                .build();

        when(userRepository.findByEmail("user@alight.com")).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        UserProfileDto updated = userService.updateUserProfile("user@alight.com", request);

        assertNotNull(updated);
        assertEquals("Janet", sampleUser.getFirstName());
        assertEquals("Smithson", sampleUser.getLastName());
    }

    @Test
    @DisplayName("Should create address for user")
    void testCreateAddress() {
        CreateAddressRequest request = CreateAddressRequest.builder()
                .recipientName("Jane Smith")
                .phone("+919876543210")
                .addressLine1("123 MG Road")
                .city("Bengaluru")
                .state("Karnataka")
                .postalCode("560001")
                .country("India")
                .isDefault(true)
                .addressType("HOME")
                .build();

        when(userRepository.findByEmail("user@alight.com")).thenReturn(Optional.of(sampleUser));
        when(addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(sampleUser.getId())).thenReturn(List.of());
        when(addressRepository.save(any(UserAddress.class))).thenReturn(sampleAddress);

        AddressDto addressDto = userService.createAddress("user@alight.com", request);

        assertNotNull(addressDto);
        assertEquals("Bengaluru", addressDto.getCity());
        assertTrue(addressDto.isDefault());
    }
}
