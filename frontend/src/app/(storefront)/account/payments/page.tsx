"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { paymentService } from "@/services/payment-service";
import { PaymentTransaction, PaymentTransactionStatus } from "@/types/payment";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Receipt,
  FileCheck,
} from "lucide-react";

export default function CustomerPaymentsPage() {
  const { token } = useAuth();
  const { formatMoney } = useCurrency();

  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await paymentService.getMyPayments(token, currentPage, 10);
      if (res.success && res.data) {
        setPayments(res.data.content || []);
        setTotalPages(res.data.totalPages || 1);
      } else {
        setError(res.message || "Failed to load payment history.");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [token, currentPage]);

  const getStatusBadge = (status: PaymentTransactionStatus) => {
    switch (status) {
      case "CAPTURED":
        return <Badge variant="success">Paid / Captured</Badge>;
      case "AUTHORIZED":
        return <Badge variant="info">Authorized</Badge>;
      case "INITIATED":
        return <Badge variant="warning">Initiated</Badge>;
      case "REFUNDED":
        return <Badge variant="brand">Refunded</Badge>;
      case "FAILED":
        return <Badge variant="danger">Failed</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Payment Receipts & History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit gateway transactions, bank transfers, and verified settlement records
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchPayments}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse p-4" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center max-w-md mx-auto shadow-2xs">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <CreditCard className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Payment History</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Completed order payments, bank wire transfers, and invoice clearances will appear here.
          </p>
          <Link href="/account/orders">
            <Button variant="primary" size="sm">
              View My Orders
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((tx) => (
            <div
              key={tx.id}
              className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {tx.transactionReference}
                  </span>
                  {getStatusBadge(tx.transactionStatus)}
                  <span className="text-xs text-slate-400">
                    {tx.createdAt
                      ? new Date(tx.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                  <span>
                    Gateway: <strong className="text-slate-800">{tx.gatewayType}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Payment Method: <strong className="text-slate-800">{tx.paymentMethod || "Direct"}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Order:{" "}
                    <Link
                      href={`/orders/${tx.orderNumber}`}
                      className="text-emerald-800 font-mono font-bold hover:underline"
                    >
                      #{tx.orderNumber}
                    </Link>
                  </span>
                </div>

                {tx.bankReferenceNumber && (
                  <p className="text-[11px] text-slate-500 font-mono">
                    Bank UTR: {tx.bankReferenceNumber}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                    Paid Amount
                  </span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    {formatMoney(tx.amount)}
                  </span>
                </div>

                <Link href={`/orders/${tx.orderNumber}`}>
                  <Button variant="outline" size="sm" className="h-8 px-3 text-xs flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Receipt</span>
                  </Button>
                </Link>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-xs font-semibold text-slate-600 px-2">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage + 1 >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* PCI-DSS & Security Guarantee */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 text-xs text-slate-600 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-800 shrink-0" />
        <div>
          <span className="font-bold text-slate-800">Secure Payment Architecture:</span> All debit/credit card
          data is tokenized via encrypted payment gateways (Razorpay, Stripe). Alight International never stores full card
          numbers, CVV, or PIN credentials.
        </div>
      </div>
    </div>
  );
}
