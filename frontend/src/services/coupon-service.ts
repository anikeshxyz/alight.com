import { ApiResponse, PageResponse } from "@/types";
import {
  ApplyCouponRequest,
  Coupon,
  CouponStatsSummary,
  CouponValidationResponse,
  CreateCouponRequest,
  PromotionBanner,
} from "@/types/coupon";

const RAW_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_BASE = RAW_API.replace(/\/api\/v1\/?$/, "");

function getAuthHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// -------------------------------------------------------------
// PUBLIC COUPON & PROMOTIONS APIS
// -------------------------------------------------------------

export async function applyCouponApi(
  payload: ApplyCouponRequest,
  token?: string | null
): Promise<ApiResponse<CouponValidationResponse>> {
  const res = await fetch(`${API_BASE}/api/v1/coupons/apply`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  return res.json();
}

export async function getAvailableCouponsApi(
  token?: string | null
): Promise<ApiResponse<Coupon[]>> {
  const res = await fetch(`${API_BASE}/api/v1/coupons/available`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });
  return res.json();
}

export async function getActivePromotionsApi(): Promise<ApiResponse<PromotionBanner[]>> {
  const res = await fetch(`${API_BASE}/api/v1/coupons/promotions`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  return res.json();
}

// -------------------------------------------------------------
// VENDOR COUPON APIS
// -------------------------------------------------------------

export async function getVendorCouponsApi(
  token?: string | null,
  page: number = 0,
  size: number = 15
): Promise<ApiResponse<PageResponse<Coupon>>> {
  const res = await fetch(`${API_BASE}/api/v1/vendor/coupons?page=${page}&size=${size}`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });
  return res.json();
}

export async function createVendorCouponApi(
  payload: CreateCouponRequest,
  token?: string | null
): Promise<ApiResponse<Coupon>> {
  const res = await fetch(`${API_BASE}/api/v1/vendor/coupons`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function toggleVendorCouponApi(
  couponId: string,
  token?: string | null
): Promise<ApiResponse<Coupon>> {
  const res = await fetch(`${API_BASE}/api/v1/vendor/coupons/${couponId}/toggle`, {
    method: "POST",
    headers: getAuthHeaders(token),
  });
  return res.json();
}

export async function getVendorCouponStatsApi(
  token?: string | null
): Promise<ApiResponse<CouponStatsSummary>> {
  const res = await fetch(`${API_BASE}/api/v1/vendor/coupons/stats`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });
  return res.json();
}

// -------------------------------------------------------------
// ADMIN COUPON & PROMOTION APIS
// -------------------------------------------------------------

export async function searchAdminCouponsApi(
  token?: string | null,
  search?: string,
  activeOnly?: boolean,
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<PageResponse<Coupon>>> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (search) params.append("search", search);
  if (activeOnly !== undefined) params.append("activeOnly", activeOnly.toString());

  const res = await fetch(`${API_BASE}/api/v1/admin/coupons?${params.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });
  return res.json();
}

export async function createAdminCouponApi(
  payload: CreateCouponRequest,
  token?: string | null
): Promise<ApiResponse<Coupon>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/coupons`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateAdminCouponApi(
  id: string,
  payload: CreateCouponRequest,
  token?: string | null
): Promise<ApiResponse<Coupon>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/coupons/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteAdminCouponApi(
  id: string,
  token?: string | null
): Promise<ApiResponse<void>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/coupons/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
  return res.json();
}

export async function toggleAdminCouponApi(
  id: string,
  token?: string | null
): Promise<ApiResponse<Coupon>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/coupons/${id}/toggle`, {
    method: "POST",
    headers: getAuthHeaders(token),
  });
  return res.json();
}

export async function getAdminCouponStatsApi(
  token?: string | null
): Promise<ApiResponse<CouponStatsSummary>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/coupons/stats`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });
  return res.json();
}

// Admin Promotions
export async function getAdminPromotionsApi(
  token?: string | null
): Promise<ApiResponse<PromotionBanner[]>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/coupons/promotions`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });
  return res.json();
}

export async function createAdminPromotionApi(
  payload: Partial<PromotionBanner>,
  token?: string | null
): Promise<ApiResponse<PromotionBanner>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/coupons/promotions`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateAdminPromotionApi(
  id: string,
  payload: Partial<PromotionBanner>,
  token?: string | null
): Promise<ApiResponse<PromotionBanner>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/coupons/promotions/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteAdminPromotionApi(
  id: string,
  token?: string | null
): Promise<ApiResponse<void>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/coupons/promotions/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
  return res.json();
}

export const couponService = {
  applyCoupon: applyCouponApi,
  getAvailablePublicCoupons: getAvailableCouponsApi,
  getActivePromotions: getActivePromotionsApi,
  getVendorCoupons: getVendorCouponsApi,
  createVendorCoupon: createVendorCouponApi,
  toggleVendorCoupon: toggleVendorCouponApi,
  getVendorStats: getVendorCouponStatsApi,
  searchAdminCoupons: searchAdminCouponsApi,
  createAdminCoupon: createAdminCouponApi,
  updateAdminCoupon: updateAdminCouponApi,
  deleteAdminCoupon: deleteAdminCouponApi,
  toggleAdminCoupon: toggleAdminCouponApi,
  getAdminStats: getAdminCouponStatsApi,
  getAdminPromotions: getAdminPromotionsApi,
  createAdminPromotion: createAdminPromotionApi,
  updateAdminPromotion: updateAdminPromotionApi,
  deleteAdminPromotion: deleteAdminPromotionApi,
};
