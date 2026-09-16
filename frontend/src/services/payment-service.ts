import { ApiResponse, PageResponse } from "@/types";
import {
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  PaymentTransaction,
  VerifyPaymentRequest,
} from "@/types/payment";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export const paymentService = {
  async initiatePayment(
    payload: InitiatePaymentRequest,
    token?: string | null
  ): Promise<ApiResponse<InitiatePaymentResponse>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/payments/initiate`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    return res.json();
  },

  async verifyPayment(
    payload: VerifyPaymentRequest,
    token?: string | null
  ): Promise<ApiResponse<PaymentTransaction>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/payments/verify`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    return res.json();
  },

  async getOrderTransactions(
    orderId: string,
    token?: string | null
  ): Promise<ApiResponse<PaymentTransaction[]>> {
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/payments/order/${orderId}`, {
      headers,
    });

    return res.json();
  },

  async getMyPayments(
    token: string,
    page = 0,
    size = 10
  ): Promise<ApiResponse<PageResponse<PaymentTransaction>>> {
    const res = await fetch(`${API_URL}/payments/my-payments?page=${page}&size=${size}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    return res.json();
  },

  // Admin APIs
  async getAdminTransactions(
    token: string,
    page = 0,
    size = 20
  ): Promise<ApiResponse<PageResponse<PaymentTransaction>>> {
    const res = await fetch(
      `${API_URL}/admin/payments/transactions?page=${page}&size=${size}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.json();
  },

  async approveBankTransfer(
    transactionId: string,
    token: string,
    adminNotes?: string
  ): Promise<ApiResponse<PaymentTransaction>> {
    const res = await fetch(
      `${API_URL}/admin/payments/${transactionId}/approve-bank-transfer`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adminNotes }),
      }
    );
    return res.json();
  },

  async processRefund(
    transactionId: string,
    amount: number,
    reason: string,
    token: string
  ): Promise<ApiResponse<PaymentTransaction>> {
    const res = await fetch(`${API_URL}/admin/payments/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ transactionId, amount, reason }),
    });
    return res.json();
  },
};
