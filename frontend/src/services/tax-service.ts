import { ApiResponse } from "@/types";
import { TaxCategory, TaxCalculationPayload, TaxCalculationResult } from "@/types/pricing";

const RAW_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_BASE = RAW_API.replace(/\/api\/v1\/?$/, "");

export async function calculateTaxApi(
  payload: TaxCalculationPayload
): Promise<ApiResponse<TaxCalculationResult>> {
  const res = await fetch(`${API_BASE}/api/v1/taxes/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getActiveTaxCategoriesApi(): Promise<ApiResponse<TaxCategory[]>> {
  const res = await fetch(`${API_BASE}/api/v1/taxes/categories`, { cache: "no-store" });
  return res.json();
}

// Admin APIs
export async function getAllTaxCategoriesAdminApi(token: string): Promise<ApiResponse<TaxCategory[]>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/taxes/categories`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return res.json();
}

export async function createTaxCategoryAdminApi(
  category: Partial<TaxCategory>,
  token: string
): Promise<ApiResponse<TaxCategory>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/taxes/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(category),
  });
  return res.json();
}
