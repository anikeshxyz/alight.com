import { ApiResponse, PageResponse } from "@/types";
import {
  BankDetailsPayload,
  PayoutRequestPayload,
  PayoutStatus,
  SettlementOverview,
  VendorPayout,
  VendorWallet,
  WalletTransaction,
  DeliveredSettlement,
} from "@/types/payment";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export const settlementService = {
  // Vendor Portal APIs
  async getVendorWallet(token: string): Promise<ApiResponse<VendorWallet>> {
    const res = await fetch(`${API_URL}/vendor/wallet`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.json();
  },

  async updateBankDetails(
    payload: BankDetailsPayload,
    token: string
  ): Promise<ApiResponse<VendorWallet>> {
    const res = await fetch(`${API_URL}/vendor/wallet/bank-details`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async requestPayout(
    payload: PayoutRequestPayload,
    token: string
  ): Promise<ApiResponse<VendorPayout>> {
    const res = await fetch(`${API_URL}/vendor/wallet/payout-request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async getVendorTransactions(
    token: string,
    page = 0,
    size = 20
  ): Promise<ApiResponse<PageResponse<WalletTransaction>>> {
    const res = await fetch(
      `${API_URL}/vendor/wallet/transactions?page=${page}&size=${size}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.json();
  },

  async getVendorPayouts(
    token: string,
    page = 0,
    size = 20
  ): Promise<ApiResponse<PageResponse<VendorPayout>>> {
    const res = await fetch(
      `${API_URL}/vendor/wallet/payouts?page=${page}&size=${size}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.json();
  },

  // Admin Console APIs
  async getAdminOverview(token: string): Promise<ApiResponse<SettlementOverview>> {
    const res = await fetch(`${API_URL}/admin/settlements/overview`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.json();
  },

  async getAdminPayouts(
    token: string,
    status?: PayoutStatus,
    page = 0,
    size = 20
  ): Promise<ApiResponse<PageResponse<VendorPayout>>> {
    let url = `${API_URL}/admin/settlements/payouts?page=${page}&size=${size}`;
    if (status) {
      url += `&status=${status}`;
    }
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.json();
  },

  async approvePayout(
    payoutId: string,
    utrNumber: string,
    adminNotes: string,
    token: string
  ): Promise<ApiResponse<VendorPayout>> {
    const res = await fetch(`${API_URL}/admin/settlements/payouts/${payoutId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ utrNumber, adminNotes }),
    });
    return res.json();
  },

  async rejectPayout(
    payoutId: string,
    rejectionReason: string,
    adminNotes: string,
    token: string
  ): Promise<ApiResponse<VendorPayout>> {
    const res = await fetch(`${API_URL}/admin/settlements/payouts/${payoutId}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rejectionReason, adminNotes }),
    });
    return res.json();
  },

  async getDeliveredSettlements(token: string): Promise<ApiResponse<DeliveredSettlement[]>> {
    const res = await fetch(`${API_URL}/admin/settlements/delivered`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.json();
  },

  async releaseEscrow(vendorOrderId: string, token: string): Promise<ApiResponse<void>> {
    const res = await fetch(`${API_URL}/admin/settlements/release/${vendorOrderId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.json();
  },

  async getAllWallets(token: string): Promise<ApiResponse<VendorWallet[]>> {
    const res = await fetch(`${API_URL}/admin/settlements/wallets`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.json();
  },

  async getAllTransactions(
    token: string,
    page = 0,
    size = 20
  ): Promise<ApiResponse<PageResponse<WalletTransaction>>> {
    const res = await fetch(`${API_URL}/admin/settlements/transactions?page=${page}&size=${size}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.json();
  },

  // Enterprise Settlement & Policy Operations
  async getSettlementsQueue(
    token: string,
    status?: string,
    page = 0,
    size = 20
  ): Promise<ApiResponse<PageResponse<any>>> {
    let url = `${API_URL}/admin/settlements/queue?page=${page}&size=${size}`;
    if (status && status !== "ALL") {
      url += `&status=${status}`;
    }
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getSettlementById(id: string, token: string): Promise<ApiResponse<any>> {
    const res = await fetch(`${API_URL}/admin/settlements/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async approveSettlement(id: string, token: string): Promise<ApiResponse<any>> {
    const res = await fetch(`${API_URL}/admin/settlements/${id}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async holdSettlement(id: string, reason: string, token: string): Promise<ApiResponse<any>> {
    const res = await fetch(`${API_URL}/admin/settlements/${id}/hold?reason=${encodeURIComponent(reason)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async releaseSettlementHold(id: string, token: string): Promise<ApiResponse<any>> {
    const res = await fetch(`${API_URL}/admin/settlements/${id}/release-hold`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getPolicies(token: string): Promise<ApiResponse<any[]>> {
    const res = await fetch(`${API_URL}/admin/settlements/policies`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async updatePolicy(id: string, dto: any, token: string): Promise<ApiResponse<any>> {
    const res = await fetch(`${API_URL}/admin/settlements/policies/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    return res.json();
  },

  async getRateCards(token: string): Promise<ApiResponse<any[]>> {
    const res = await fetch(`${API_URL}/admin/settlements/rate-cards`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getTaxRules(token: string): Promise<ApiResponse<any[]>> {
    const res = await fetch(`${API_URL}/admin/settlements/tax-rules`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getRecoveries(token: string, page = 0, size = 20): Promise<ApiResponse<PageResponse<any>>> {
    const res = await fetch(`${API_URL}/admin/settlements/recoveries?page=${page}&size=${size}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async applyManualAdjustment(payload: any, token: string): Promise<ApiResponse<any>> {
    const res = await fetch(`${API_URL}/admin/settlements/adjustments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async getReconciliationRecords(token: string, status?: string, page = 0, size = 20): Promise<ApiResponse<PageResponse<any>>> {
    let url = `${API_URL}/admin/settlements/reconciliation?page=${page}&size=${size}`;
    if (status && status !== "ALL") {
      url += `&status=${status}`;
    }
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async runGatewayReconciliation(token: string): Promise<ApiResponse<any>> {
    const res = await fetch(`${API_URL}/admin/settlements/reconciliation/gateway`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async runPayoutReconciliation(token: string): Promise<ApiResponse<any>> {
    const res = await fetch(`${API_URL}/admin/settlements/reconciliation/payouts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // Vendor Portal Enterprise Settlements
  async getVendorSettlements(token: string, page = 0, size = 20): Promise<ApiResponse<PageResponse<any>>> {
    const res = await fetch(`${API_URL}/vendor/wallet/settlements?page=${page}&size=${size}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getVendorRecoveries(token: string, page = 0, size = 20): Promise<ApiResponse<PageResponse<any>>> {
    const res = await fetch(`${API_URL}/vendor/wallet/recoveries?page=${page}&size=${size}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
};

