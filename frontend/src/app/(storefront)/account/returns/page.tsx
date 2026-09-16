"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  RotateCcw,
  Package,
  Calendar,
  Truck,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Store,
} from "lucide-react";
import { getMyReturnsApi } from "@/services/returns-service";
import { RmaRequest, RmaStatus } from "@/types/returns";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function CustomerReturnsPage() {
  const { token, user, isLoading: isAuthLoading } = useAuth();
  const { formatMoney } = useCurrency();
  const [returns, setReturns] = useState<RmaRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getMyReturnsApi(token)
      .then((res) => {
        if (res.success && res.data) {
          setReturns(res.data.content || []);
        } else {
          setError(res.message || "Could not retrieve your return requests");
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load returns");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  const getRmaStatusBadge = (status: RmaStatus) => {
    switch (status) {
      case "REQUESTED":
        return <Badge variant="warning">Under Review</Badge>;
      case "APPROVED":
        return <Badge variant="info">Approved for Return</Badge>;
      case "PICKUP_SCHEDULED":
      case "IN_REVERSE_TRANSIT":
        return <Badge variant="brand">Reverse Pickup Booked</Badge>;
      case "RECEIVED_AT_WAREHOUSE":
        return <Badge variant="info">At Warehouse (QA)</Badge>;
      case "REFUND_PROCESSED":
        return <Badge variant="success">Refund Credited</Badge>;
      case "REPLACEMENT_DISPATCHED":
        return <Badge variant="success">Replacement Shipped</Badge>;
      case "REJECTED":
      case "INSPECTED_FAIL":
        return <Badge variant="danger">Return Rejected</Badge>;
      case "CANCELLED":
        return <Badge variant="neutral">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (!token && !isAuthLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-brand-emerald-50 text-brand-emerald-800 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <RotateCcw className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-brand-slate-900">Please Sign In</h2>
        <p className="text-sm text-brand-slate-500 mt-1 mb-6">
          Sign in with your Alight customer account to view and manage your returns.
        </p>
        <Link href="/">
          <Button variant="primary">Return Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-brand-emerald-800">
              Account Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-slate-900 tracking-tight flex items-center gap-2.5 mt-1">
            <RotateCcw className="w-7 h-7 text-brand-emerald-800" />
            <span>Returns & Exchanges (RMA)</span>
          </h1>
          <p className="text-xs sm:text-sm text-brand-slate-500 mt-1">
            Track reverse courier pickups, quality inspections, and refund progress for your orders.
          </p>
        </div>

        <Link href="/account/orders">
          <Button variant="outline" size="sm" className="text-xs font-semibold">
            View Past Orders
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-brand-emerald-800 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs font-medium text-brand-slate-600">Loading your returns history...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-600" />
          <p className="font-semibold text-sm">{error}</p>
        </div>
      ) : returns.length === 0 ? (
        <div className="bg-white border border-brand-slate-200 rounded-3xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-brand-slate-100 text-brand-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <RotateCcw className="w-8 h-8 opacity-50" />
          </div>
          <h3 className="text-lg font-bold text-brand-slate-900">No Return Requests Found</h3>
          <p className="text-xs text-brand-slate-500 mt-1 max-w-md mx-auto mb-6">
            You have not initiated any returns or exchanges. To request a return, go to your order details page.
          </p>
          <Link href="/account/orders">
            <Button variant="primary">Browse Your Orders</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((rma) => (
            <div
              key={rma.id}
              className="bg-white border border-brand-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div className="space-y-3 min-w-0 flex-grow">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs font-black text-brand-emerald-950 bg-brand-emerald-100/80 px-2.5 py-1 rounded-md">
                    {rma.rmaNumber}
                  </span>
                  {getRmaStatusBadge(rma.status)}
                  <span className="text-xs text-brand-slate-400 font-medium">
                    Requested on {new Date(rma.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-brand-slate-600">
                  <p className="flex items-center gap-1.5 font-semibold text-brand-slate-800">
                    <Store className="w-3.5 h-3.5 text-brand-slate-400" />
                    <span>Vendor: {rma.vendorStoreName}</span>
                  </p>
                  <p>
                    Order Ref:{" "}
                    <Link
                      href={`/orders/${rma.orderNumber}`}
                      className="font-mono font-bold text-brand-emerald-800 hover:underline"
                    >
                      {rma.orderNumber}
                    </Link>
                  </p>
                  <p>
                    Items: <strong>{rma.items?.length || 0} unit(s)</strong>
                  </p>
                  <p>
                    Est. Refund: <strong className="text-brand-slate-900">{formatMoney(rma.netRefundAmount || rma.refundAmount)}</strong>
                  </p>
                </div>

                {rma.reverseAwbNumber && (
                  <div className="flex items-center gap-2 text-xs bg-indigo-50/80 border border-indigo-100 px-3 py-1.5 rounded-xl text-indigo-900 w-fit">
                    <Truck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>
                      Reverse Courier: <strong>{rma.reverseCarrierCode || "Express Courier"}</strong>
                    </span>
                    <span>•</span>
                    <span className="font-mono font-bold text-indigo-700">{rma.reverseAwbNumber}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-shrink-0">
                <Link href={`/account/returns/${rma.rmaNumber}`}>
                  <Button variant="outline" size="sm" className="w-full md:w-auto text-xs font-semibold gap-1.5">
                    <span>View RMA Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
