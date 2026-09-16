import { ApiResponse, PageResponse } from "@/types";
import {
  CreateQuotePayload,
  Quote,
  QuoteOfferPayload,
  QuoteStatus,
} from "@/types/order";

const RAW_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_BASE = RAW_API.replace(/\/api\/v1\/?$/, "");

export async function createQuoteApi(
  payload: CreateQuotePayload,
  token: string
): Promise<ApiResponse<Quote>> {
  const res = await fetch(`${API_BASE}/api/v1/quotes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getBuyerQuotesApi(
  token: string,
  page = 0,
  size = 10
): Promise<ApiResponse<PageResponse<Quote>>> {
  const res = await fetch(`${API_BASE}/api/v1/quotes/my-quotes?page=${page}&size=${size}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return res.json();
}

export async function getQuoteByIdApi(
  quoteId: string,
  token: string
): Promise<ApiResponse<Quote>> {
  const res = await fetch(`${API_BASE}/api/v1/quotes/${quoteId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return res.json();
}

export async function acceptQuoteApi(
  quoteId: string,
  token: string
): Promise<ApiResponse<Quote>> {
  const res = await fetch(`${API_BASE}/api/v1/quotes/${quoteId}/accept`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function rejectQuoteApi(
  quoteId: string,
  reason?: string,
  token?: string
): Promise<ApiResponse<Quote>> {
  const reasonParam = reason ? `?reason=${encodeURIComponent(reason)}` : "";
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/api/v1/quotes/${quoteId}/reject${reasonParam}`, {
    method: "POST",
    headers,
  });
  return res.json();
}

// --- Vendor RFQ APIs ---

export async function getVendorQuotesApi(
  token: string,
  status?: QuoteStatus,
  page = 0,
  size = 10
): Promise<ApiResponse<PageResponse<Quote>>> {
  const statusParam = status ? `&status=${status}` : "";
  const res = await fetch(
    `${API_BASE}/api/v1/quotes/vendor?page=${page}&size=${size}${statusParam}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );
  return res.json();
}

export async function submitVendorOfferApi(
  quoteId: string,
  payload: QuoteOfferPayload,
  token: string
): Promise<ApiResponse<Quote>> {
  const res = await fetch(`${API_BASE}/api/v1/quotes/vendor/${quoteId}/offer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}
