import { ApiResponse, PageResponse } from "@/types";
import {
  CheckoutSummary,
  InitiateCheckoutPayload,
  Order,
  OrderStatus,
  FulfillmentStatus,
  UpdateFulfillmentPayload,
  VendorOrder,
} from "@/types/order";

const RAW_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_BASE = RAW_API.replace(/\/api\/v1\/?$/, "");

export async function previewCheckoutApi(
  payload: InitiateCheckoutPayload,
  token?: string
): Promise<ApiResponse<CheckoutSummary>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/api/v1/checkout/preview`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function initiateCheckoutApi(
  payload: InitiateCheckoutPayload,
  token?: string
): Promise<ApiResponse<Order>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/api/v1/checkout`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getOrderByNumberApi(
  orderNumber: string,
  token?: string
): Promise<ApiResponse<Order>> {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/api/v1/orders/${encodeURIComponent(orderNumber)}`, {
    headers,
    cache: "no-store",
  });
  return res.json();
}

export async function getCustomerOrdersApi(
  token: string,
  page = 0,
  size = 10,
  status?: OrderStatus
): Promise<ApiResponse<PageResponse<Order>>> {
  const statusParam = status ? `&status=${status}` : "";
  const res = await fetch(`${API_BASE}/api/v1/orders/my-orders?page=${page}&size=${size}${statusParam}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return res.json();
}

// --- Vendor Orders ---

export async function getVendorOrdersApi(
  token: string,
  status?: FulfillmentStatus,
  page = 0,
  size = 10
): Promise<ApiResponse<PageResponse<VendorOrder>>> {
  const statusParam = status ? `&status=${status}` : "";
  const res = await fetch(
    `${API_BASE}/api/v1/vendor/orders?page=${page}&size=${size}${statusParam}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );
  return res.json();
}

export async function updateVendorOrderFulfillmentApi(
  vendorOrderId: string,
  payload: UpdateFulfillmentPayload,
  token: string
): Promise<ApiResponse<VendorOrder>> {
  const res = await fetch(`${API_BASE}/api/v1/vendor/orders/${vendorOrderId}/fulfillment`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// --- Admin Orders ---

export async function getAllOrdersAdminApi(
  token: string,
  status?: OrderStatus,
  page = 0,
  size = 15
): Promise<ApiResponse<PageResponse<Order>>> {
  const statusParam = status ? `&status=${status}` : "";
  const res = await fetch(
    `${API_BASE}/api/v1/admin/orders?page=${page}&size=${size}${statusParam}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );
  return res.json();
}

export async function updateOrderStatusAdminApi(
  orderId: string,
  status: OrderStatus,
  token: string
): Promise<ApiResponse<Order>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/orders/${orderId}/status?status=${status}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
