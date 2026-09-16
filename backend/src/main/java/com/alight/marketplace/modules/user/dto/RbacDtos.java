package com.alight.marketplace.modules.user.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public class RbacDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleDetailDto {
        private UUID id;
        private String name;
        private String description;
        private List<PermissionDto> permissions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PermissionDto {
        private UUID id;
        private String name;
        private String description;
        private String domain;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserRolesUpdateRequest {
        @NotEmpty(message = "At least one role must be provided")
        private Set<String> roles;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RolePermissionsUpdateRequest {
        @NotEmpty(message = "At least one permission must be provided")
        private Set<String> permissions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserEffectivePermissionsDto {
        private UUID userId;
        private String email;
        private String fullName;
        private Set<String> roles;
        private Set<String> permissions;
        private UUID vendorId;
        private boolean isVendor;
        private boolean isAdmin;
        private boolean isSuperAdmin;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminUserSummaryDto {
        private UUID id;
        private String email;
        private String firstName;
        private String lastName;
        private String phone;
        private boolean active;
        private Set<String> roles;
        private java.time.Instant lastLoginAt;
        private java.time.Instant createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateAdminUserRequest {
        @jakarta.validation.constraints.NotBlank(message = "Email is required")
        @jakarta.validation.constraints.Email(message = "Invalid email format")
        private String email;

        @jakarta.validation.constraints.NotBlank(message = "Password is required")
        private String password;

        @jakarta.validation.constraints.NotBlank(message = "First name is required")
        private String firstName;

        @jakarta.validation.constraints.NotBlank(message = "Last name is required")
        private String lastName;

        private String phone;

        @NotEmpty(message = "At least one role must be provided")
        private Set<String> roles;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateUserStatusRequest {
        private boolean active;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResetUserPasswordRequest {
        @jakarta.validation.constraints.NotBlank(message = "New password is required")
        private String newPassword;
    }
}
