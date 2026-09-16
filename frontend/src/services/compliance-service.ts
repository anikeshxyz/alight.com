import { apiClient } from './api-client';
import { ApiResponse, PageResponse } from '@/types';
import {
  CommissionInvoice,
  TaxComplianceLedger,
  Gstr8Summary,
  PayoutBatch,
  AutoSettlementResult,
  CreatePayoutBatchPayload,
} from '@/types/compliance';

// --- Admin Compliance & Automation APIs ---
export async function getAdminTaxLedgersApi(
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<PageResponse<TaxComplianceLedger>>> {
  return apiClient<PageResponse<TaxComplianceLedger>>(`/admin/compliance/ledgers?page=${page}&size=${size}`);
}

export async function getGstr8SummaryApi(
  financialYear: string = '2025-2026',
  quarter?: string
): Promise<ApiResponse<Gstr8Summary>> {
  const query = new URLSearchParams({ financialYear });
  if (quarter) query.append('quarter', quarter);
  return apiClient<Gstr8Summary>(`/admin/compliance/gstr8?${query.toString()}`);
}

export async function getAdminCommissionInvoicesApi(
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<PageResponse<CommissionInvoice>>> {
  return apiClient<PageResponse<CommissionInvoice>>(`/admin/compliance/invoices?page=${page}&size=${size}`);
}

export async function generateCommissionInvoiceApi(
  vendorId: string,
  month: number,
  year: number
): Promise<ApiResponse<CommissionInvoice>> {
  return apiClient<CommissionInvoice>(`/admin/compliance/invoices/generate?vendorId=${vendorId}&month=${month}&year=${year}`, {
    method: 'POST',
  });
}

export async function runAutoSettlementApi(): Promise<ApiResponse<AutoSettlementResult>> {
  return apiClient<AutoSettlementResult>('/admin/settlements/automation/run-auto-settlement', {
    method: 'POST',
  });
}

export async function getPayoutBatchesApi(
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<PageResponse<PayoutBatch>>> {
  return apiClient<PageResponse<PayoutBatch>>(`/admin/settlements/automation/batches?page=${page}&size=${size}`);
}

export async function createPayoutBatchApi(
  payload: CreatePayoutBatchPayload
): Promise<ApiResponse<PayoutBatch>> {
  return apiClient<PayoutBatch>('/admin/settlements/automation/batches', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function processPayoutBatchApi(
  batchId: string,
  bankBatchId?: string
): Promise<ApiResponse<PayoutBatch>> {
  return apiClient<PayoutBatch>(`/admin/settlements/automation/batches/${batchId}/process`, {
    method: 'POST',
    body: JSON.stringify({ bankBatchId }),
  });
}

// --- Vendor Compliance APIs ---
export async function getVendorTaxLedgersApi(
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<PageResponse<TaxComplianceLedger>>> {
  return apiClient<PageResponse<TaxComplianceLedger>>(`/vendor/compliance/ledgers?page=${page}&size=${size}`);
}

export async function getVendorCommissionInvoicesApi(
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<PageResponse<CommissionInvoice>>> {
  return apiClient<PageResponse<CommissionInvoice>>(`/vendor/compliance/invoices?page=${page}&size=${size}`);
}
