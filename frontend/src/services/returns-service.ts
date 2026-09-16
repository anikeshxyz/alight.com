import { ApiResponse, PageResponse } from "@/types";
import {
  CreateRmaRequest,
  RmaInspectionRequest,
  RmaPolicy,
  RmaRequest,
  RmaReviewRequest,
  RmaSchedulePickupRequest,
  RmaStatsSummary,
  RmaStatus,
} from "@/types/returns";

const RAW_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_BASE = RAW_API.replace(/\/api\/v1\/?$/, "");

function getAuthHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// -------------------------------------------------------------
// CUSTOMER RMA APIS
// -------------------------------------------------------------

export async function createReturnRequestApi(
  payload: CreateRmaRequest,
  token: string
): Promise<ApiResponse<RmaRequest>> {
  const res = await fetch(`${API_BASE}/api/v1/returns`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getMyReturnsApi(
  token: string,
  page: number = 0,
  size: number = 10
): Promise<ApiResponse<PageResponse<RmaRequest>>> {
  const res = await fetch(`${API_BASE}/api/v1/returns/my-returns?page=${page}&size=${size}`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });
  return res.json();
}

export async function getRmaDetailsApi(
  rmaNumber: string,
  token: string
): Promise<ApiResponse<RmaRequest>> {
  const res = await fetch(`${API_BASE}/api/v1/returns/${rmaNumber}`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });
  return res.json();
}

export async function cancelReturnRequestApi(
  rmaNumber: string,
  token: string
): Promise<ApiResponse<RmaRequest>> {
  const res = await fetch(`${API_BASE}/api/v1/returns/${rmaNumber}/cancel`, {
    method: "POST",
    headers: getAuthHeaders(token),
  });
  return res.json();
}

export async function getEffectiveReturnPolicyApi(
  categoryId?: string,
  vendorId?: string
): Promise<ApiResponse<RmaPolicy>> {
  const params = new URLSearchParams();
  if (categoryId) params.append("categoryId", categoryId);
  if (vendorId) params.append("vendorId", vendorId);
  const res = await fetch(`${API_BASE}/api/v1/returns/policy?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  return res.json();
}

// -------------------------------------------------------------
// VENDOR RMA APIS
// -------------------------------------------------------------

export async function getVendorReturnsApi(
  token: string,
  status?: RmaStatus,
  page: number = 0,
  size: number = 15
): Promise<ApiResponse<PageResponse<RmaRequest>>> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (status) params.append("status", status);

  const res = await fetch(`${API_BASE}/api/v1/vendor/returns?${params.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });
  return res.json();
}

export async function getVendorRmaStatsApi(
  token: string
): Promise<ApiResponse<RmaStatsSummary>> {
  const res = await fetch(`${API_BASE}/api/v1/vendor/returns/stats`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });
  return res.json();
}

export async function getVendorRmaDetailsApi(
  rmaId: string,
  token: string
): Promise<ApiResponse<RmaRequest>> {
  const res = await fetch(`${API_BASE}/api/v1/vendor/returns/${rmaId}`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });
  return res.json();
}

export async function reviewVendorRmaApi(
  rmaId: string,
  payload: RmaReviewRequest,
  token: string
): Promise<ApiResponse<RmaRequest>> {
  const res = await fetch(`${API_BASE}/api/v1/vendor/returns/${rmaId}/review`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function scheduleReversePickupApi(
  rmaId: string,
  payload: RmaSchedulePickupRequest,
  token: string
): Promise<ApiResponse<RmaRequest>> {
  const res = await fetch(`${API_BASE}/api/v1/vendor/returns/${rmaId}/schedule-pickup`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function inspectVendorRmaApi(
  rmaId: string,
  payload: RmaInspectionRequest,
  token: string
): Promise<ApiResponse<RmaRequest>> {
  const res = await fetch(`${API_BASE}/api/v1/vendor/returns/${rmaId}/inspect`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.json();
}

// -------------------------------------------------------------
// ADMIN RMA APIS
// -------------------------------------------------------------

export async function searchAdminReturnsApi(
  token: string,
  status?: RmaStatus,
  search?: string,
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<PageResponse<RmaRequest>>> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (status) params.append("status", status);
  if (search) params.append("search", search);

  const res = await fetch(`${API_BASE}/api/v1/admin/returns?${params.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });
  return res.json();
}

export async function getAdminRmaStatsApi(
  token: string
): Promise<ApiResponse<RmaStatsSummary>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/returns/stats`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });
  return res.json();
}

export async function getAdminRmaDetailsApi(
  rmaId: string,
  token: string
): Promise<ApiResponse<RmaRequest>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/returns/${rmaId}`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });
  return res.json();
}

export async function adminOverrideRmaApi(
  rmaId: string,
  payload: RmaInspectionRequest,
  token: string
): Promise<ApiResponse<RmaRequest>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/returns/${rmaId}/override`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getAdminReturnPoliciesApi(
  token: string
): Promise<ApiResponse<RmaPolicy[]>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/returns/policies`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });
  return res.json();
}

export async function createAdminReturnPolicyApi(
  payload: Partial<RmaPolicy>,
  token: string
): Promise<ApiResponse<RmaPolicy>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/returns/policies`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateAdminReturnPolicyApi(
  id: string,
  payload: Partial<RmaPolicy>,
  token: string
): Promise<ApiResponse<RmaPolicy>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/returns/policies/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteAdminReturnPolicyApi(
  id: string,
  token: string
): Promise<ApiResponse<void>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/returns/policies/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
  return res.json();
}
