package com.alight.marketplace.modules.user.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.common.security.annotation.RequireAdmin;
import com.alight.marketplace.common.security.annotation.RequireSuperAdmin;
import com.alight.marketplace.modules.user.dto.RbacDtos.*;
import com.alight.marketplace.modules.user.service.RbacService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/rbac")
@RequiredArgsConstructor
@RequireAdmin
@Tag(name = "Admin RBAC & Permissions", description = "Endpoints for managing roles, granular permissions, and user role assignments")
public class AdminRbacController {

    private final RbacService rbacService;

    @GetMapping("/roles")
    @Operation(summary = "List all roles and bound permissions", description = "Retrieves all marketplace roles with their associated permissions")
    public ResponseEntity<ApiResponse<List<RoleDetailDto>>> getAllRoles() {
        List<RoleDetailDto> roles = rbacService.getAllRoles();
        return ResponseEntity.ok(ApiResponse.success(roles));
    }

    @GetMapping("/permissions")
    @Operation(summary = "List all system permissions", description = "Retrieves the complete catalog of fine-grained permissions categorized by domain")
    public ResponseEntity<ApiResponse<List<PermissionDto>>> getAllPermissions() {
        List<PermissionDto> permissions = rbacService.getAllPermissions();
        return ResponseEntity.ok(ApiResponse.success(permissions));
    }

    @GetMapping("/users/{userId}/roles")
    @Operation(summary = "Get user roles and effective permissions", description = "Retrieves the assigned roles and computed permission set for a given user")
    public ResponseEntity<ApiResponse<UserEffectivePermissionsDto>> getUserRolesAndPermissions(@PathVariable UUID userId) {
        UserEffectivePermissionsDto dto = rbacService.getUserEffectivePermissions(userId);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PutMapping("/users/{userId}/roles")
    @RequireSuperAdmin
    @Operation(summary = "Update user roles (Super Admin only)", description = "Assigns or modifies role bindings for a target user")
    public ResponseEntity<ApiResponse<UserEffectivePermissionsDto>> updateUserRoles(
            @PathVariable UUID userId,
            @Valid @RequestBody UserRolesUpdateRequest request
    ) {
        UserEffectivePermissionsDto updated = rbacService.updateUserRoles(userId, request.getRoles());
        return ResponseEntity.ok(ApiResponse.success(updated, "User roles updated successfully"));
    }

    @PutMapping("/roles/{roleName}/permissions")
    @RequireSuperAdmin
    @Operation(summary = "Update role permissions (Super Admin only)", description = "Binds or updates the set of granular permissions for a given role")
    public ResponseEntity<ApiResponse<RoleDetailDto>> updateRolePermissions(
            @PathVariable String roleName,
            @Valid @RequestBody RolePermissionsUpdateRequest request
    ) {
        RoleDetailDto updated = rbacService.updateRolePermissions(roleName, request.getPermissions());
        return ResponseEntity.ok(ApiResponse.success(updated, "Role permissions updated successfully"));
    }

    @GetMapping("/users")
    @Operation(summary = "List all administrative staff users", description = "Retrieves all users assigned to administrative roles")
    public ResponseEntity<ApiResponse<List<AdminUserSummaryDto>>> getAllAdminUsers() {
        List<AdminUserSummaryDto> users = rbacService.getAllAdminUsers();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PostMapping("/users")
    @RequireSuperAdmin
    @Operation(summary = "Create admin user (Super Admin only)", description = "Creates a new operator account and binds assigned administrative roles")
    public ResponseEntity<ApiResponse<AdminUserSummaryDto>> createAdminUser(
            @Valid @RequestBody CreateAdminUserRequest request
    ) {
        AdminUserSummaryDto created = rbacService.createAdminUser(request);
        return ResponseEntity.ok(ApiResponse.success(created, "Admin user created successfully"));
    }

    @PutMapping("/users/{userId}/status")
    @RequireSuperAdmin
    @Operation(summary = "Enable/disable admin user (Super Admin only)", description = "Toggles active status of an administrative operator")
    public ResponseEntity<ApiResponse<AdminUserSummaryDto>> updateUserStatus(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserStatusRequest request
    ) {
        AdminUserSummaryDto updated = rbacService.updateUserStatus(userId, request.isActive());
        return ResponseEntity.ok(ApiResponse.success(updated, "User status updated successfully"));
    }

    @PostMapping("/users/{userId}/reset-password")
    @RequireSuperAdmin
    @Operation(summary = "Reset admin user credentials (Super Admin only)", description = "Sets new password and clears account locks for target user")
    public ResponseEntity<ApiResponse<Void>> resetUserPassword(
            @PathVariable UUID userId,
            @Valid @RequestBody ResetUserPasswordRequest request
    ) {
        rbacService.resetUserPassword(userId, request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success(null, "Password reset successfully"));
    }
}
