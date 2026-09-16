package com.alight.marketplace.modules.user.service;

import com.alight.marketplace.modules.user.dto.AddressDto;
import com.alight.marketplace.modules.user.dto.CreateAddressRequest;
import com.alight.marketplace.modules.user.dto.UpdateProfileRequest;
import com.alight.marketplace.modules.user.dto.UserProfileDto;

import java.util.List;
import java.util.UUID;

public interface UserService {

    UserProfileDto getCurrentUserProfile(String email);

    UserProfileDto updateUserProfile(String email, UpdateProfileRequest request);

    List<AddressDto> getUserAddresses(String email);

    AddressDto createAddress(String email, CreateAddressRequest request);

    void deleteAddress(String email, UUID addressId);

    AddressDto setDefaultAddress(String email, UUID addressId);

    AddressDto updateAddress(String email, UUID addressId, CreateAddressRequest request);

    com.alight.marketplace.modules.user.dto.CustomerDashboardDto getCustomerDashboard(String email);
}
