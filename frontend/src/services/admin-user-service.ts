import { apiClient } from "./api-client";
import { ApiResponse } from "@/types";

export interface PermissionDto {
  id: string;
  name: string;
  description: string;
  domain: string;
}

export interface RoleDetailDto {
  id: string;
  name: string;
  description: string;
  permissions: PermissionDto[];
}

export interface AdminUserSummaryDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  active: boolean;
  roles: string[];
  lastLoginAt?: string;
  createdAt?: string;
}

export interface CreateAdminUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: string[];
}

export interface UserEffectivePermissionsDto {
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  vendorId?: string;
  isVendor: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export const adminUserService = {
  // Roles & Permissions
  async getAllRoles(): Promise<RoleDetailDto[]> {
    const res = await apiClient<RoleDetailDto[]>("/admin/rbac/roles");
    return res.data;
  },

  async getAllPermissions(): Promise<PermissionDto[]> {
    const res = await apiClient<PermissionDto[]>("/admin/rbac/permissions");
    return res.data;
  },

  async getUserRolesAndPermissions(userId: string): Promise<UserEffectivePermissionsDto> {
    const res = await apiClient<UserEffectivePermissionsDto>(`/admin/rbac/users/${userId}/roles`);
    return res.data;
  },

  async updateUserRoles(userId: string, roles: string[]): Promise<UserEffectivePermissionsDto> {
    const res = await apiClient<UserEffectivePermissionsDto>(`/admin/rbac/users/${userId}/roles`, {
      method: "PUT",
      body: JSON.stringify({ roles }),
    });
    return res.data;
  },

  async updateRolePermissions(roleName: string, permissions: string[]): Promise<RoleDetailDto> {
    const res = await apiClient<RoleDetailDto>(`/admin/rbac/roles/${roleName}/permissions`, {
      method: "PUT",
      body: JSON.stringify({ permissions }),
    });
    return res.data;
  },

  // Admin Users Management
  async getAllAdminUsers(): Promise<AdminUserSummaryDto[]> {
    const res = await apiClient<AdminUserSummaryDto[]>("/admin/rbac/users");
    return res.data;
  },

  async createAdminUser(data: CreateAdminUserRequest): Promise<AdminUserSummaryDto> {
    const res = await apiClient<AdminUserSummaryDto>("/admin/rbac/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateUserStatus(userId: string, active: boolean): Promise<AdminUserSummaryDto> {
    const res = await apiClient<AdminUserSummaryDto>(`/admin/rbac/users/${userId}/status`, {
      method: "PUT",
      body: JSON.stringify({ active }),
    });
    return res.data;
  },

  async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    await apiClient<void>(`/admin/rbac/users/${userId}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    });
  },
};
