package com.alight.marketplace.common.security;

import com.alight.marketplace.modules.order.repository.OrderRepository;
import com.alight.marketplace.modules.order.repository.VendorOrderRepository;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.support.repository.SupportTicketRepository;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserAddressRepository;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service("securityService")
@RequiredArgsConstructor
public class ResourceSecurityService {

    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final VendorOrderRepository vendorOrderRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final UserAddressRepository userAddressRepository;

    public Optional<String> getCurrentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return Optional.empty();
        }
        return Optional.ofNullable(auth.getName());
    }

    public Optional<User> getCurrentUser() {
        return getCurrentUserEmail().flatMap(userRepository::findByEmail);
    }

    public Optional<UUID> getCurrentUserId() {
        return getCurrentUser().map(User::getId);
    }

    public Optional<Vendor> getCurrentVendor() {
        return getCurrentUserId().flatMap(vendorRepository::findByUserId);
    }

    public Optional<UUID> getCurrentVendorId() {
        return getCurrentVendor().map(Vendor::getId);
    }

    public boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        String targetRole = role.startsWith("ROLE_") ? role : "ROLE_" + role;
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equalsIgnoreCase(targetRole) || a.equalsIgnoreCase(role));
    }

    public boolean hasPermission(String permission) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equalsIgnoreCase(permission));
    }

    public boolean isSuperAdmin() {
        return hasRole("SUPER_ADMIN");
    }

    public boolean isAdmin() {
        return hasRole("ADMIN") || isSuperAdmin();
    }

    public boolean isVendor() {
        return hasRole("VENDOR");
    }

    public boolean isOwner(UUID targetUserId) {
        if (targetUserId == null) return false;
        if (isAdmin()) return true;
        return getCurrentUserId()
                .map(id -> id.equals(targetUserId))
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public boolean isVendorOwnerOfProduct(UUID productId) {
        if (productId == null) return false;
        if (isAdmin()) return true;

        Optional<UUID> currentVendorId = getCurrentVendorId();
        if (currentVendorId.isEmpty()) return false;

        return productRepository.findById(productId)
                .map(product -> product.getVendor() != null && product.getVendor().getId().equals(currentVendorId.get()))
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public boolean isVendorOwnerOfOrder(UUID vendorOrderId) {
        if (vendorOrderId == null) return false;
        if (isAdmin()) return true;

        Optional<UUID> currentVendorId = getCurrentVendorId();
        if (currentVendorId.isEmpty()) return false;

        return vendorOrderRepository.findById(vendorOrderId)
                .map(vo -> vo.getVendor() != null && vo.getVendor().getId().equals(currentVendorId.get()))
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public boolean isOwnerOfOrder(UUID orderId) {
        if (orderId == null) return false;
        if (isAdmin()) return true;

        Optional<UUID> currentUserId = getCurrentUserId();
        if (currentUserId.isEmpty()) return false;

        return orderRepository.findById(orderId)
                .map(order -> order.getUser() != null && order.getUser().getId().equals(currentUserId.get()))
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public boolean isOwnerOfTicket(UUID ticketId) {
        if (ticketId == null) return false;
        if (isAdmin()) return true;

        Optional<UUID> currentUserId = getCurrentUserId();
        if (currentUserId.isEmpty()) return false;

        return supportTicketRepository.findById(ticketId)
                .map(ticket -> ticket.getUser() != null && ticket.getUser().getId().equals(currentUserId.get()))
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public boolean isOwnerOfAddress(UUID addressId) {
        if (addressId == null) return false;
        if (isAdmin()) return true;

        Optional<UUID> currentUserId = getCurrentUserId();
        if (currentUserId.isEmpty()) return false;

        return userAddressRepository.findById(addressId)
                .map(addr -> addr.getUserId() != null && addr.getUserId().equals(currentUserId.get()))
                .orElse(false);
    }
}
