import { ApiResponse, PageResponse } from "@/types";
import {
  Warehouse,
  CreateWarehousePayload,
  UpdateWarehousePayload,
  WarehouseStock,
  StockAdjustmentPayload,
  StockTransferPayload,
  InventoryTransaction,
  StockReservation,
  StockReservationPayload,
  ProductStockOverview,
} from "@/types/inventory";

const RAW_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_BASE = RAW_API.replace(/\/api\/v1\/?$/, "");

// --- Vendor Warehouses & Stock ---

export async function getVendorWarehousesApi(token: string): Promise<ApiResponse<Warehouse[]>> {
  const res = await fetch(`${API_BASE}/api/v1/vendor/warehouses`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function createVendorWarehouseApi(
  payload: CreateWarehousePayload,
  token: string
): Promise<ApiResponse<Warehouse>> {
  const res = await fetch(`${API_BASE}/api/v1/vendor/warehouses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateVendorWarehouseApi(
  id: string,
  payload: UpdateWarehousePayload,
  token: string
): Promise<ApiResponse<Warehouse>> {
  const res = await fetch(`${API_BASE}/api/v1/vendor/warehouses/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteVendorWarehouseApi(
  id: string,
  token: string
): Promise<ApiResponse<void>> {
  const res = await fetch(`${API_BASE}/api/v1/vendor/warehouses/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getVendorInventoryApi(token: string): Promise<ApiResponse<WarehouseStock[]>> {
  const res = await fetch(`${API_BASE}/api/v1/vendor/inventory`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getVendorLowStockAlertsApi(token: string): Promise<ApiResponse<WarehouseStock[]>> {
  const res = await fetch(`${API_BASE}/api/v1/vendor/inventory/low-stock`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function adjustStockApi(
  payload: StockAdjustmentPayload,
  token: string
): Promise<ApiResponse<WarehouseStock>> {
  const res = await fetch(`${API_BASE}/api/v1/vendor/inventory/adjust`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function transferStockApi(
  payload: StockTransferPayload,
  token: string
): Promise<ApiResponse<void>> {
  const res = await fetch(`${API_BASE}/api/v1/vendor/inventory/transfer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getVendorTransactionsApi(
  token: string,
  page = 0,
  size = 20
): Promise<ApiResponse<PageResponse<InventoryTransaction>>> {
  const res = await fetch(`${API_BASE}/api/v1/vendor/inventory/transactions?page=${page}&size=${size}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// --- Admin Warehouses & Global Inventory ---

export async function getAllWarehousesAdminApi(token: string): Promise<ApiResponse<Warehouse[]>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/warehouses`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function createPlatformWarehouseAdminApi(
  payload: CreateWarehousePayload,
  token: string
): Promise<ApiResponse<Warehouse>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/warehouses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getGlobalInventoryAdminApi(token: string): Promise<ApiResponse<WarehouseStock[]>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/inventory`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getGlobalLowStockAdminApi(token: string): Promise<ApiResponse<WarehouseStock[]>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/inventory/low-stock`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getGlobalTransactionsAdminApi(
  token: string,
  page = 0,
  size = 20
): Promise<ApiResponse<PageResponse<InventoryTransaction>>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/inventory/transactions?page=${page}&size=${size}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// --- Storefront Stock & Reservation Engine ---

export async function getProductStockOverviewApi(productId: string): Promise<ApiResponse<ProductStockOverview>> {
  const res = await fetch(`${API_BASE}/api/v1/products/${productId}/inventory`);
  return res.json();
}

export async function holdStockReservationApi(
  payload: StockReservationPayload,
  token?: string
): Promise<ApiResponse<StockReservation>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/v1/inventory/reservations/hold`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function cancelStockReservationApi(reservationToken: string): Promise<ApiResponse<void>> {
  const res = await fetch(`${API_BASE}/api/v1/inventory/reservations/${reservationToken}/cancel`, {
    method: "POST",
  });
  return res.json();
}
