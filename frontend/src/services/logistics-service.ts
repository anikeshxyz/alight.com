import { ApiResponse, PageResponse } from "@/types";
import {
  AddTrackingEventRequest,
  CreateShipmentRequest,
  LogisticsOverviewDto,
  RateCalculationRequest,
  ServiceabilityCheckRequest,
  ServiceabilityResponseDto,
  ShipmentPackageDto,
  ShippingCarrier,
  ShippingLabelDto,
  ShippingRateDto,
  TrackingEventDto,
  TrackingTimelineDto,
} from "@/types/logistics";

const RAW_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_BASE = RAW_API.replace(/\/api\/v1\/?$/, "");

// -------------------------------------------------------------
// PUBLIC LOGISTICS API
// -------------------------------------------------------------

export async function checkPincodeServiceabilityApi(
  payload: ServiceabilityCheckRequest
): Promise<ApiResponse<ServiceabilityResponseDto>> {
  const res = await fetch(`${API_BASE}/api/v1/logistics/serviceability`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  return res.json();
}

export async function calculateShippingRatesApi(
  payload: RateCalculationRequest
): Promise<ApiResponse<ShippingRateDto[]>> {
  const res = await fetch(`${API_BASE}/api/v1/logistics/rates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  return res.json();
}

export async function getPublicTrackingTimelineApi(
  awbNumber: string
): Promise<ApiResponse<TrackingTimelineDto>> {
  const res = await fetch(`${API_BASE}/api/v1/logistics/track/${encodeURIComponent(awbNumber)}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  return res.json();
}

export async function getActiveCarriersApi(): Promise<ApiResponse<ShippingCarrier[]>> {
  const res = await fetch(`${API_BASE}/api/v1/logistics/carriers`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  return res.json();
}

// -------------------------------------------------------------
// VENDOR LOGISTICS API
// -------------------------------------------------------------

export async function createVendorShipmentApi(
  payload: CreateShipmentRequest,
  token: string
): Promise<ApiResponse<ShipmentPackageDto>> {
  const res = await fetch(`${API_BASE}/api/v1/vendor/logistics/shipments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getVendorShipmentsApi(
  token: string,
  page = 0,
  size = 20
): Promise<ApiResponse<PageResponse<ShipmentPackageDto>>> {
  const res = await fetch(`${API_BASE}/api/v1/vendor/logistics/shipments?page=${page}&size=${size}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  return res.json();
}

export async function getShippingLabelApi(
  packageId: string,
  token: string
): Promise<ApiResponse<ShippingLabelDto>> {
  const res = await fetch(`${API_BASE}/api/v1/vendor/logistics/shipments/${encodeURIComponent(packageId)}/label`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  return res.json();
}

export async function cancelShipmentApi(
  awbNumber: string,
  token: string
): Promise<ApiResponse<void>> {
  const res = await fetch(`${API_BASE}/api/v1/vendor/logistics/shipments/${encodeURIComponent(awbNumber)}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

// -------------------------------------------------------------
// ADMIN LOGISTICS API
// -------------------------------------------------------------

export async function getAdminLogisticsOverviewApi(
  token: string
): Promise<ApiResponse<LogisticsOverviewDto>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/logistics/overview`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  return res.json();
}

export async function getAdminShipmentsApi(
  token: string,
  page = 0,
  size = 20
): Promise<ApiResponse<PageResponse<ShipmentPackageDto>>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/logistics/shipments?page=${page}&size=${size}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  return res.json();
}

export async function getAdminCarriersApi(
  token: string
): Promise<ApiResponse<ShippingCarrier[]>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/logistics/carriers`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  return res.json();
}

export async function toggleCarrierStatusApi(
  carrierId: string,
  active: boolean,
  token: string
): Promise<ApiResponse<ShippingCarrier>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/logistics/carriers/${encodeURIComponent(carrierId)}/status?active=${active}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function dispatchCheckpointCheckpointApi(
  awbNumber: string,
  payload: AddTrackingEventRequest,
  token: string
): Promise<ApiResponse<TrackingEventDto>> {
  const res = await fetch(`${API_BASE}/api/v1/admin/logistics/shipments/${encodeURIComponent(awbNumber)}/checkpoint`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}
