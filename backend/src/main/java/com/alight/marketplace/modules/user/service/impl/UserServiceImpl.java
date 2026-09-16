package com.alight.marketplace.modules.user.service.impl;

import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.user.dto.AddressDto;
import com.alight.marketplace.modules.user.dto.CreateAddressRequest;
import com.alight.marketplace.modules.user.dto.UpdateProfileRequest;
import com.alight.marketplace.modules.user.dto.UserProfileDto;
import com.alight.marketplace.modules.user.entity.Role;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.entity.UserAddress;
import com.alight.marketplace.modules.user.repository.UserAddressRepository;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.alight.marketplace.modules.notification.repository.NotificationRepository;
import com.alight.marketplace.modules.order.dto.OrderDto;
import com.alight.marketplace.modules.order.entity.OrderStatus;
import com.alight.marketplace.modules.order.repository.OrderRepository;
import com.alight.marketplace.modules.order.service.OrderService;
import com.alight.marketplace.modules.quote.entity.QuoteStatus;
import com.alight.marketplace.modules.quote.repository.QuoteRequestRepository;
import com.alight.marketplace.modules.returns.dto.RmaResponseDto;
import com.alight.marketplace.modules.returns.service.RmaService;
import com.alight.marketplace.modules.support.entity.TicketStatus;
import com.alight.marketplace.modules.support.repository.SupportTicketRepository;
import com.alight.marketplace.modules.user.dto.*;
import com.alight.marketplace.modules.wishlist.repository.WishlistRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserAddressRepository addressRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final RmaService rmaService;
    private final WishlistRepository wishlistRepository;
    private final SupportTicketRepository ticketRepository;
    private final QuoteRequestRepository quoteRequestRepository;
    private final NotificationRepository notificationRepository;

    @Override
    @Transactional(readOnly = true)
    public UserProfileDto getCurrentUserProfile(String email) {
        User user = findUserByEmail(email);
        return mapToProfileDto(user);
    }

    @Override
    @Transactional
    public UserProfileDto updateUserProfile(String email, UpdateProfileRequest request) {
        User user = findUserByEmail(email);
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        User saved = userRepository.save(user);
        log.info("Updated profile for user: {}", email);
        return mapToProfileDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddressDto> getUserAddresses(String email) {
        User user = findUserByEmail(email);
        return addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToAddressDto)
                .toList();
    }

    @Override
    @Transactional
    public AddressDto createAddress(String email, CreateAddressRequest request) {
        User user = findUserByEmail(email);

        if (request.isDefault()) {
            clearDefaultAddresses(user.getId());
        }

        UserAddress address = UserAddress.builder()
                .userId(user.getId())
                .recipientName(request.getRecipientName())
                .phone(request.getPhone())
                .addressLine1(request.getAddressLine1())
                .addressLine2(request.getAddressLine2())
                .city(request.getCity())
                .state(request.getState())
                .postalCode(request.getPostalCode())
                .country(request.getCountry() != null ? request.getCountry() : "India")
                .isDefault(request.isDefault())
                .addressType(request.getAddressType() != null ? request.getAddressType() : "HOME")
                .build();

        UserAddress saved = addressRepository.save(address);
        log.info("Created address {} for user {}", saved.getId(), email);
        return mapToAddressDto(saved);
    }

    @Override
    @Transactional
    public void deleteAddress(String email, UUID addressId) {
        User user = findUserByEmail(email);
        UserAddress address = addressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Address not found or unauthorized"));
        addressRepository.delete(address);
        log.info("Deleted address {} for user {}", addressId, email);
    }

    @Override
    @Transactional
    public AddressDto setDefaultAddress(String email, UUID addressId) {
        User user = findUserByEmail(email);
        UserAddress address = addressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Address not found or unauthorized"));

        clearDefaultAddresses(user.getId());
        address.setDefault(true);
        UserAddress saved = addressRepository.save(address);
        return mapToAddressDto(saved);
    }

    @Override
    @Transactional
    public AddressDto updateAddress(String email, UUID addressId, CreateAddressRequest request) {
        User user = findUserByEmail(email);
        UserAddress address = addressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Address not found or unauthorized"));

        if (request.isDefault() && !address.isDefault()) {
            clearDefaultAddresses(user.getId());
        }

        address.setRecipientName(request.getRecipientName());
        address.setPhone(request.getPhone());
        address.setAddressLine1(request.getAddressLine1());
        address.setAddressLine2(request.getAddressLine2());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPostalCode(request.getPostalCode());
        if (request.getCountry() != null) {
            address.setCountry(request.getCountry());
        }
        if (request.getAddressType() != null) {
            address.setAddressType(request.getAddressType());
        }
        address.setDefault(request.isDefault());

        UserAddress saved = addressRepository.save(address);
        log.info("Updated address {} for user {}", addressId, email);
        return mapToAddressDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerDashboardDto getCustomerDashboard(String email) {
        User user = findUserByEmail(email);
        UUID userId = user.getId();

        // 1. Order stats
        long totalOrders = orderRepository.countByUserId(userId);
        long activeOrders = orderRepository.countByUserIdAndOrderStatusIn(
                userId,
                List.of(OrderStatus.PLACED, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED)
        );
        Page<OrderDto> recentOrdersPage = orderService.getCustomerOrders(userId, PageRequest.of(0, 5));

        // 2. Returns stats
        Page<RmaResponseDto> recentRmasPage = rmaService.getMyReturns(email, PageRequest.of(0, 5));

        // 3. Wishlist count
        long wishlistCount = wishlistRepository.findByUserId(userId)
                .map(w -> (long) w.getItems().size())
                .orElse(0L);

        // 4. Open Support tickets
        long openTickets = ticketRepository.countByUserIdAndStatusIn(
                userId,
                List.of(TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_ON_CUSTOMER, TicketStatus.WAITING_ON_VENDOR)
        );

        // 5. Active RFQs / Quotes
        long activeQuotes = quoteRequestRepository.countByUserIdAndStatusIn(
                userId,
                List.of(QuoteStatus.PENDING, QuoteStatus.OFFERED)
        );

        // 6. Unread notifications
        long unreadNotifications = notificationRepository.countByUserIdAndReadFalse(userId);

        // 7. Saved addresses
        long savedAddresses = addressRepository.countByUserId(userId);

        CustomerDashboardDto.DashboardMetrics metrics = CustomerDashboardDto.DashboardMetrics.builder()
                .totalOrders(totalOrders)
                .activeOrders(activeOrders)
                .wishlistCount(wishlistCount)
                .openTicketsCount(openTickets)
                .activeQuotesCount(activeQuotes)
                .unreadNotificationsCount(unreadNotifications)
                .savedAddressesCount(savedAddresses)
                .build();

        return CustomerDashboardDto.builder()
                .profile(mapToProfileDto(user))
                .metrics(metrics)
                .recentOrders(recentOrdersPage.getContent())
                .recentReturns(recentRmasPage.getContent())
                .build();
    }

    private void clearDefaultAddresses(UUID userId) {
        List<UserAddress> addresses = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId);
        for (UserAddress addr : addresses) {
            if (addr.isDefault()) {
                addr.setDefault(false);
                addressRepository.save(addr);
            }
        }
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private UserProfileDto mapToProfileDto(User user) {
        List<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .toList();

        return UserProfileDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .emailVerified(user.isEmailVerified())
                .phoneVerified(user.isPhoneVerified())
                .roles(roleNames)
                .createdAt(user.getCreatedAt())
                .build();
    }

    private AddressDto mapToAddressDto(UserAddress address) {
        return AddressDto.builder()
                .id(address.getId())
                .userId(address.getUserId())
                .recipientName(address.getRecipientName())
                .phone(address.getPhone())
                .addressLine1(address.getAddressLine1())
                .addressLine2(address.getAddressLine2())
                .city(address.getCity())
                .state(address.getState())
                .postalCode(address.getPostalCode())
                .country(address.getCountry())
                .isDefault(address.isDefault())
                .addressType(address.getAddressType())
                .createdAt(address.getCreatedAt())
                .build();
    }
}
