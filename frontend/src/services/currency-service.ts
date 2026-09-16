import { ApiResponse } from "@/types";
import { Currency, ConvertCurrencyPayload, ConvertCurrencyResult } from "@/types/pricing";

const RAW_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_BASE = RAW_API.replace(/\/api\/v1\/?$/, "");

export async function getActiveCurrenciesApi(): Promise<ApiResponse<Currency[]>> {
  const res = await fetch(`${API_BASE}/api/v1/currencies`, { cache: "no-store" });
  return res.json();
}

export async function getBaseCurrencyApi(): Promise<ApiResponse<Currency>> {
  const res = await fetch(`${API_BASE}/api/v1/currencies/base`, { cache: "no-store" });
  return res.json();
}

export async function convertCurrencyApi(
  payload: ConvertCurrencyPayload
): Promise<ApiResponse<ConvertCurrencyResult>> {
  const res = await fetch(`${API_BASE}/api/v1/currencies/convert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// Admin APIs
export async function getAllCurrenciesAdminApi(token: string): Promise<ApiResponse<Currency[]>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/currencies`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return res.json();
}

export async function updateExchangeRateAdminApi(
  code: string,
  exchangeRate: number,
  token: string
): Promise<ApiResponse<Currency>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/currencies/rates`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code, exchangeRate, source: "ADMIN_CONSOLE" }),
  });
  return res.json();
}

export async function toggleCurrencyStatusAdminApi(
  code: string,
  active: boolean,
  token: string
): Promise<ApiResponse<Currency>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/currencies/${code}/status?active=${active}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
