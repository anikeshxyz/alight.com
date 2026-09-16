package com.alight.marketplace.modules.user.service.impl;

import com.alight.marketplace.common.exception.BusinessRuleException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.user.dto.RbacDtos.*;
import com.alight.marketplace.modules.user.entity.Permission;
import com.alight.marketplace.modules.user.entity.Role;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.PermissionRepository;
import com.alight.marketplace.modules.user.repository.RoleRepository;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.user.service.RbacService;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RbacServiceImpl implements RbacService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public List<RoleDetailDto> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(this::mapToRoleDetailDto)
                .sorted(Comparator.comparing(RoleDetailDto::getName))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PermissionDto> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(this::mapToPermissionDto)
                .sorted(Comparator.comparing(PermissionDto::getName))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserEffectivePermissionsDto getUserEffectivePermissions(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        return buildEffectivePermissions(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserEffectivePermissionsDto getCurrentUserEffectivePermissions(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return buildEffectivePermissions(user);
    }

    @Override
    @Transactional
    public UserEffectivePermissionsDto updateUserRoles(UUID userId, Set<String> roleNames) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        if (roleNames == null || roleNames.isEmpty()) {
            throw new BusinessRuleException("User must have at least one role assigned");
        }

        Set<Role> targetRoles = new HashSet<>();
        for (String roleName : roleNames) {
            String formattedRole = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;
            Role role = roleRepository.findByName(formattedRole)
                    .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + formattedRole));
            targetRoles.add(role);
        }

        user.setRoles(targetRoles);
        User saved = userRepository.save(user);
        log.info("Updated roles for user {} ({}) to {}", saved.getEmail(), saved.getId(), roleNames);

        return buildEffectivePermissions(saved);
    }

    @Override
    @Transactional
    public RoleDetailDto updateRolePermissions(String roleName, Set<String> permissionNames) {
        String formattedRole = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;
        Role role = roleRepository.findByName(formattedRole)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + formattedRole));

        if ("ROLE_SUPER_ADMIN".equalsIgnoreCase(formattedRole)) {
            throw new BusinessRuleException("ROLE_SUPER_ADMIN permissions are immutable and inherently unrestricted");
        }

        Set<Permission> targetPermissions = new HashSet<>();
        if (permissionNames != null) {
            for (String permName : permissionNames) {
                Permission perm = permissionRepository.findByName(permName)
                        .orElseThrow(() -> new ResourceNotFoundException("Permission not found: " + permName));
                targetPermissions.add(perm);
            }
        }

        role.setPermissions(targetPermissions);
        Role saved = roleRepository.save(role);
        log.info("Updated permissions for role {} to {} permissions", saved.getName(), targetPermissions.size());

        return mapToRoleDetailDto(saved);
    }

    private UserEffectivePermissionsDto buildEffectivePermissions(User user) {
        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        Set<String> permissions = user.getRoles().stream()
                .filter(r -> r.getPermissions() != null)
                .flatMap(r -> r.getPermissions().stream())
                .map(Permission::getName)
                .collect(Collectors.toSet());

        // Super Admin has all permissions automatically
        if (roleNames.contains("ROLE_SUPER_ADMIN")) {
            permissions = permissionRepository.findAll().stream()
                    .map(Permission::getName)
                    .collect(Collectors.toSet());
        }

        Optional<Vendor> vendorOpt = vendorRepository.findByUserId(user.getId());

        return UserEffectivePermissionsDto.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFirstName() + " " + user.getLastName())
                .roles(roleNames)
                .permissions(permissions)
                .vendorId(vendorOpt.map(Vendor::getId).orElse(null))
                .isVendor(roleNames.contains("ROLE_VENDOR"))
                .isAdmin(roleNames.contains("ROLE_ADMIN") || roleNames.contains("ROLE_SUPER_ADMIN"))
                .isSuperAdmin(roleNames.contains("ROLE_SUPER_ADMIN"))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminUserSummaryDto> getAllAdminUsers() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRoles() != null && u.getRoles().stream().anyMatch(r -> r.getName().contains("ADMIN")))
                .map(this::mapToAdminUserSummaryDto)
                .sorted(Comparator.comparing(AdminUserSummaryDto::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    @Override
    @Transactional
    public AdminUserSummaryDto createAdminUser(CreateAdminUserRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BusinessRuleException("User with email " + request.getEmail() + " already exists");
        }

        Set<Role> targetRoles = new HashSet<>();
        for (String roleName : request.getRoles()) {
            String formatted = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;
            Role role = roleRepository.findByName(formatted)
                    .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + formatted));
            targetRoles.add(role);
        }

        User user = User.builder()
                .email(request.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .phone(request.getPhone())
                .active(true)
                .emailVerified(true)
                .phoneVerified(false)
                .roles(targetRoles)
                .build();

        User saved = userRepository.save(user);
        log.info("Created new admin user: {} with roles {}", saved.getEmail(), request.getRoles());
        return mapToAdminUserSummaryDto(saved);
    }

    @Override
    @Transactional
    public AdminUserSummaryDto updateUserStatus(UUID userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        user.setActive(active);
        User saved = userRepository.save(user);
        log.info("Updated status of user {} to active={}", saved.getEmail(), active);
        return mapToAdminUserSummaryDto(saved);
    }

    @Override
    @Transactional
    public void resetUserPassword(UUID userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setAccountLockedUntil(null);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);
        log.info("Reset password for user {}", user.getEmail());
    }

    private AdminUserSummaryDto mapToAdminUserSummaryDto(User user) {
        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        return AdminUserSummaryDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .active(user.isActive())
                .roles(roleNames)
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private RoleDetailDto mapToRoleDetailDto(Role role) {
        List<PermissionDto> permissionDtos = (role.getPermissions() != null)
                ? role.getPermissions().stream().map(this::mapToPermissionDto).sorted(Comparator.comparing(PermissionDto::getName)).toList()
                : List.of();

        return RoleDetailDto.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .permissions(permissionDtos)
                .build();
    }

    private PermissionDto mapToPermissionDto(Permission permission) {
        String domain = "general";
        if (permission.getName().contains(":")) {
            domain = permission.getName().substring(0, permission.getName().indexOf(':'));
        }

        return PermissionDto.builder()
                .id(permission.getId())
                .name(permission.getName())
                .description(permission.getDescription())
                .domain(domain)
                .build();
    }
}
