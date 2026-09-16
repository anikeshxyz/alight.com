import { ApiResponse } from "@/types";
import {
  ProductTierPrice,
  CreateTierPricePayload,
  PriceCalculationPayload,
  PriceCalculationResult,
} from "@/types/pricing";

const RAW_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_BASE = RAW_API.replace(/\/api\/v1\/?$/, "");

export async function getProductTierPricesApi(productId: string): Promise<ApiResponse<ProductTierPrice[]>> {
  const res = await fetch(`${API_BASE}/api/v1/products/${productId}/tier-prices`, {
    cache: "no-store",
  });
  return res.json();
}

export async function createTierPriceApi(
  productId: string,
  payload: CreateTierPricePayload,
  token: string
): Promise<ApiResponse<ProductTierPrice>> {
  const res = await fetch(`${API_BASE}/api/v1/products/${productId}/tier-prices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteTierPriceApi(
  productId: string,
  tierId: string,
  token: string
): Promise<ApiResponse<void>> {
  const res = await fetch(`${API_BASE}/api/v1/products/${productId}/tier-prices/${tierId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function calculatePriceApi(
  payload: PriceCalculationPayload
): Promise<ApiResponse<PriceCalculationResult>> {
  const res = await fetch(`${API_BASE}/api/v1/pricing/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}
