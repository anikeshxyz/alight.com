import { apiClient } from "./api-client";
import { UserProfile, UserAddress, CreateAddressPayload } from "@/types/auth";
import { ApiResponse } from "@/types";

export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  phone?: string;
}

export async function getProfileApi(token: string): Promise<ApiResponse<UserProfile>> {
  return apiClient<UserProfile>("/users/profile", { token });
}

export async function updateProfileApi(
  payload: UpdateProfilePayload,
  token: string
): Promise<ApiResponse<UserProfile>> {
  return apiClient<UserProfile>("/users/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
    token,
  });
}

export async function getAddressesApi(token: string): Promise<ApiResponse<UserAddress[]>> {
  return apiClient<UserAddress[]>("/users/addresses", { token });
}

export async function addAddressApi(
  payload: CreateAddressPayload,
  token: string
): Promise<ApiResponse<UserAddress>> {
  return apiClient<UserAddress>("/users/addresses", {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export async function setDefaultAddressApi(
  addressId: string,
  token: string
): Promise<ApiResponse<UserAddress>> {
  return apiClient<UserAddress>(`/users/addresses/${addressId}/default`, {
    method: "PUT",
    token,
  });
}

export async function updateAddressApi(
  addressId: string,
  payload: CreateAddressPayload,
  token: string
): Promise<ApiResponse<UserAddress>> {
  return apiClient<UserAddress>(`/users/addresses/${addressId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    token,
  });
}

export async function deleteAddressApi(
  addressId: string,
  token: string
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/users/addresses/${addressId}`, {
    method: "DELETE",
    token,
  });
}

export async function getCustomerDashboardApi(
  token: string
): Promise<ApiResponse<import("@/types/dashboard").CustomerDashboardData>> {
  return apiClient<import("@/types/dashboard").CustomerDashboardData>("/users/dashboard", {
    token,
  });
}
