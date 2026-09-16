import { apiClient } from "./api-client";
import { ApiResponse } from "@/types";
import { AddToCartPayload, CartResponse } from "@/types/cart";

export async function getCartApi(
  guestSessionId?: string,
  token?: string
): Promise<ApiResponse<CartResponse>> {
  const params: Record<string, string> = {};
  if (guestSessionId) params.guestSessionId = guestSessionId;
  return apiClient<CartResponse>("/cart", { params, token });
}

export async function addToCartApi(
  payload: AddToCartPayload,
  token?: string
): Promise<ApiResponse<CartResponse>> {
  return apiClient<CartResponse>("/cart/items", {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export async function updateCartItemQuantityApi(
  cartItemId: string,
  quantity: number,
  guestSessionId?: string,
  token?: string
): Promise<ApiResponse<CartResponse>> {
  const params: Record<string, string> = {};
  if (guestSessionId) params.guestSessionId = guestSessionId;
  return apiClient<CartResponse>(`/cart/items/${cartItemId}`, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
    params,
    token,
  });
}

export async function removeCartItemApi(
  cartItemId: string,
  guestSessionId?: string,
  token?: string
): Promise<ApiResponse<CartResponse>> {
  const params: Record<string, string> = {};
  if (guestSessionId) params.guestSessionId = guestSessionId;
  return apiClient<CartResponse>(`/cart/items/${cartItemId}`, {
    method: "DELETE",
    params,
    token,
  });
}

export async function clearCartApi(
  guestSessionId?: string,
  token?: string
): Promise<ApiResponse<CartResponse>> {
  const params: Record<string, string> = {};
  if (guestSessionId) params.guestSessionId = guestSessionId;
  return apiClient<CartResponse>("/cart", {
    method: "DELETE",
    params,
    token,
  });
}

export async function mergeGuestCartApi(
  guestSessionId: string,
  token: string
): Promise<ApiResponse<CartResponse>> {
  return apiClient<CartResponse>("/cart/merge", {
    method: "POST",
    body: JSON.stringify({ guestSessionId }),
    token,
  });
}
