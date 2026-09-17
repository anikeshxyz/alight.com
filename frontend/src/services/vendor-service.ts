import { apiClient } from "./api-client";
import {
  VendorProfile,
  VendorBusinessDetails,
  VendorPickupAddress,
  PublicVendorStore,
  VendorApplicationPayload,
  UpdateVendorProfilePayload,
  UpdateBusinessDetailsPayload,
  UpdateKycDocumentsPayload,
  CreatePickupAddressPayload,
  UpdateVendorStatusPayload,
  UpdateCommissionPayload,
} from "@/types/vendor";
import { ApiResponse } from "@/types";

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Vendor Self-Service API
export async function applyAsVendorApi(
  payload: VendorApplicationPayload,
  token: string
): Promise<ApiResponse<VendorProfile>> {
  return apiClient<VendorProfile>("/vendors/apply", {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export async function getCurrentVendorApi(token: string): Promise<ApiResponse<VendorProfile>> {
  return apiClient<VendorProfile>("/vendors/me", { token });
}

export async function updateVendorProfileApi(
  payload: UpdateVendorProfilePayload,
  token: string
): Promise<ApiResponse<VendorProfile>> {
  return apiClient<VendorProfile>("/vendors/me", {
    method: "PUT",
    body: JSON.stringify(payload),
    token,
  });
}

export async function updateVendorBusinessDetailsApi(
  payload: UpdateBusinessDetailsPayload,
  token: string
): Promise<ApiResponse<VendorBusinessDetails>> {
  return apiClient<VendorBusinessDetails>("/vendors/me/business-details", {
    method: "PUT",
    body: JSON.stringify(payload),
    token,
  });
}

export async function updateKycDocumentsApi(
  payload: UpdateKycDocumentsPayload,
  token: string
): Promise<ApiResponse<VendorBusinessDetails>> {
  return apiClient<VendorBusinessDetails>("/vendors/me/kyc-documents", {
    method: "PUT",
    body: JSON.stringify(payload),
    token,
  });
}

export async function getVendorPickupAddressesApi(
  token: string
): Promise<ApiResponse<VendorPickupAddress[]>> {
  return apiClient<VendorPickupAddress[]>("/vendors/me/pickup-addresses", { token });
}

export async function addVendorPickupAddressApi(
  payload: CreatePickupAddressPayload,
  token: string
): Promise<ApiResponse<VendorPickupAddress>> {
  return apiClient<VendorPickupAddress>("/vendors/me/pickup-addresses", {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export async function setPrimaryVendorPickupAddressApi(
  addressId: string,
  token: string
): Promise<ApiResponse<VendorPickupAddress>> {
  return apiClient<VendorPickupAddress>(`/vendors/me/pickup-addresses/${addressId}/primary`, {
    method: "PUT",
    token,
  });
}

export async function deleteVendorPickupAddressApi(
  addressId: string,
  token: string
): Promise<ApiResponse<void>> {
  return apiClient<void>(`/vendors/me/pickup-addresses/${addressId}`, {
    method: "DELETE",
    token,
  });
}

// Public Storefront API
export async function getPublicVendorStoreApi(
  slug: string
): Promise<ApiResponse<PublicVendorStore>> {
  return apiClient<PublicVendorStore>(`/vendors/stores/${slug}`);
}

// Admin Vendor Management API
export async function adminListVendorsApi(
  token: string,
  status?: string,
  search?: string,
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<PagedResponse<VendorProfile>>> {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (search) params.append("search", search);
  params.append("page", page.toString());
  params.append("size", size.toString());

  const query = params.toString() ? `?${params.toString()}` : "";
  return apiClient<PagedResponse<VendorProfile>>(`/admin/vendors${query}`, { token });
}

export async function adminGetVendorByIdApi(
  vendorId: string,
  token: string
): Promise<ApiResponse<VendorProfile>> {
  return apiClient<VendorProfile>(`/admin/vendors/${vendorId}`, { token });
}

export async function adminUpdateVendorStatusApi(
  vendorId: string,
  payload: UpdateVendorStatusPayload,
  token: string
): Promise<ApiResponse<VendorProfile>> {
  return apiClient<VendorProfile>(`/admin/vendors/${vendorId}/status`, {
    method: "PUT",
    body: JSON.stringify(payload),
    token,
  });
}

export async function adminUpdateCommissionApi(
  vendorId: string,
  payload: UpdateCommissionPayload,
  token: string
): Promise<ApiResponse<VendorProfile>> {
  return apiClient<VendorProfile>(`/admin/vendors/${vendorId}/commission`, {
    method: "PUT",
    body: JSON.stringify(payload),
    token,
  });
}
