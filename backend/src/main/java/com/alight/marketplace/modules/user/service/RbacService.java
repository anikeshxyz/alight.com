package com.alight.marketplace.modules.user.service;

import com.alight.marketplace.modules.user.dto.RbacDtos.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface RbacService {

    List<RoleDetailDto> getAllRoles();

    List<PermissionDto> getAllPermissions();

    UserEffectivePermissionsDto getUserEffectivePermissions(UUID userId);

    UserEffectivePermissionsDto getCurrentUserEffectivePermissions(String email);

    UserEffectivePermissionsDto updateUserRoles(UUID userId, Set<String> roleNames);

    RoleDetailDto updateRolePermissions(String roleName, Set<String> permissionNames);

    List<AdminUserSummaryDto> getAllAdminUsers();

    AdminUserSummaryDto createAdminUser(CreateAdminUserRequest request);

    AdminUserSummaryDto updateUserStatus(UUID userId, boolean active);

    void resetUserPassword(UUID userId, String newPassword);
}
