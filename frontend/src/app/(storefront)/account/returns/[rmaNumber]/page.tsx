"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  RotateCcw,
  Package,
  Calendar,
  Truck,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Store,
  MapPin,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { cancelReturnRequestApi, getRmaDetailsApi } from "@/services/returns-service";
import { RmaRequest, RmaStatus } from "@/types/returns";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function CustomerRmaDetailsPage() {
  const params = useParams();
  const rmaNumber = params.rmaNumber as string;
  const { token } = useAuth();
  const { formatMoney } = useCurrency();

  const [rma, setRma] = useState<RmaRequest | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const fetchRma = async () => {
    if (!rmaNumber || !token) return;
    setIsLoading(true);
    try {
      const res = await getRmaDetailsApi(rmaNumber, token);
      if (res.success && res.data) {
        setRma(res.data);
      } else {
        setError(res.message || "RMA not found");
      }
    } catch (e: any) {
      setError(e.message || "Failed to load RMA details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRma();
  }, [rmaNumber, token]);

  const handleCancel = async () => {
    if (!token || !rma) return;
    if (!confirm("Are you sure you want to cancel this return request?")) return;

    setIsCancelling(true);
    try {
      const res = await cancelReturnRequestApi(rma.rmaNumber, token);
      if (res.success && res.data) {
        setRma(res.data);
      } else {
        alert(res.message || "Failed to cancel return");
      }
    } catch (e: any) {
      alert(e.message || "Error cancelling return");
    } finally {
      setIsCancelling(false);
    }
  };

  const getRmaStatusBadge = (status: RmaStatus) => {
    switch (status) {
      case "REQUESTED":
        return <Badge variant="warning">Under Vendor Review</Badge>;
      case "APPROVED":
        return <Badge variant="info">Return Approved</Badge>;
      case "PICKUP_SCHEDULED":
        return <Badge variant="brand">Reverse Pickup Scheduled</Badge>;
      case "IN_REVERSE_TRANSIT":
        return <Badge variant="brand">In Courier Transit</Badge>;
      case "RECEIVED_AT_WAREHOUSE":
        return <Badge variant="info">Received at Central QA</Badge>;
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

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-emerald-800 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-brand-slate-600">Loading RMA return details...</p>
      </div>
    );
  }

  if (error || !rma) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16">
        <div className="w-16 h-16 bg-rose-50 text-rose-700 rounded-3xl flex items-center justify-center mb-4">
          <RotateCcw className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-brand-slate-900 mb-2">Return Request Not Found</h2>
        <p className="text-sm text-brand-slate-500 mb-6">{error || "Could not retrieve the requested RMA."}</p>
        <Link href="/account/returns">
          <Button variant="primary">Back to Your Returns</Button>
        </Link>
      </div>
    );
  }

  // Milestones Calculation
  const milestones = [
    { key: "REQUESTED", label: "Requested" },
    { key: "APPROVED", label: "Approved" },
    { key: "PICKUP_SCHEDULED", label: "Pickup Booked" },
    { key: "RECEIVED_AT_WAREHOUSE", label: "Warehouse QA" },
    { key: "REFUND_PROCESSED", label: "Resolution Complete" },
  ];

  const getStepIndex = (status: RmaStatus) => {
    switch (status) {
      case "REQUESTED":
        return 0;
      case "APPROVED":
        return 1;
      case "PICKUP_SCHEDULED":
      case "IN_REVERSE_TRANSIT":
        return 2;
      case "RECEIVED_AT_WAREHOUSE":
        return 3;
      case "INSPECTED_PASS":
      case "REFUND_PROCESSED":
      case "REPLACEMENT_DISPATCHED":
      case "CLOSED":
        return 4;
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex(rma.status);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Top Breadcrumb */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link
          href="/account/returns"
          className="text-xs font-semibold text-brand-slate-500 hover:text-brand-emerald-800 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Returns</span>
        </Link>

        {(rma.status === "REQUESTED" || rma.status === "APPROVED") && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            isLoading={isCancelling}
            className="text-xs text-rose-700 hover:bg-rose-50 border-rose-200"
          >
            Cancel Return Request
          </Button>
        )}
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-brand-slate-900 to-brand-slate-950 text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-brand-emerald-800/80 rounded-2xl flex items-center justify-center flex-shrink-0 text-brand-gold-400">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-brand-emerald-300 uppercase tracking-wider font-semibold">
                  RMA Return Authorization
                </span>
                {getRmaStatusBadge(rma.status)}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black mt-1 font-mono tracking-tight">
                {rma.rmaNumber}
              </h1>
              <p className="text-xs sm:text-sm text-brand-slate-300 mt-1">
                Order <Link href={`/orders/${rma.orderNumber}`} className="underline font-bold text-white hover:text-brand-gold-400">{rma.orderNumber}</Link> ({rma.subOrderNumber}) • Vendor: {rma.vendorStoreName}
              </p>
            </div>
          </div>

          <div className="sm:text-right bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/10">
            <span className="text-xs text-brand-slate-300 block">Est. Refund Amount</span>
            <span className="text-2xl sm:text-3xl font-black text-brand-gold-400">
              {formatMoney(rma.netRefundAmount || rma.refundAmount)}
            </span>
            <span className="text-[10px] text-brand-emerald-300 block mt-0.5">
              Resolution Mode: {rma.returnType}
            </span>
          </div>
        </div>
      </div>

      {/* Milestone Progress Bar */}
      {rma.status !== "REJECTED" && rma.status !== "CANCELLED" && (
        <div className="bg-white rounded-3xl border border-brand-slate-200 p-6 sm:p-8 mb-8 shadow-sm">
          <h3 className="text-xs uppercase font-bold tracking-wider text-brand-slate-400 mb-6">
            Live Return Progress & Milestone Tracking
          </h3>

          <div className="relative flex justify-between items-center">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-brand-slate-200 -translate-y-1/2 z-0" />
            <div
              className="absolute top-1/2 left-0 h-1 bg-brand-emerald-800 -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${(currentStep / (milestones.length - 1)) * 100}%` }}
            />

            {milestones.map((m, idx) => {
              const isPassed = idx <= currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div key={m.key} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isPassed
                        ? "bg-brand-emerald-800 text-white ring-4 ring-brand-emerald-100"
                        : "bg-brand-slate-200 text-brand-slate-500"
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-semibold mt-2 text-center hidden sm:block ${
                      isCurrent
                        ? "text-brand-emerald-950 font-bold"
                        : isPassed
                        ? "text-brand-slate-700"
                        : "text-brand-slate-400"
                    }`}
                  >
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Items & Event History */}
        <div className="lg:col-span-8 space-y-6">
          {/* Returned Items Card */}
          <div className="bg-white rounded-3xl border border-brand-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-brand-slate-900 flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-brand-emerald-800" />
              <span>Returned Items Breakdown</span>
            </h3>

            <div className="divide-y divide-brand-slate-100">
              {rma.items.map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                  <div className="w-14 h-14 bg-brand-slate-100 rounded-xl overflow-hidden flex-shrink-0 relative border border-brand-slate-200">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.productTitle} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-slate-400">
                        <ShoppingBag className="w-5 h-5 opacity-40" />
                      </div>
                    )}
                  </div>

                  <div className="flex-grow min-w-0">
                    <h4 className="text-sm font-bold text-brand-slate-900 line-clamp-1">
                      {item.productTitle}
                    </h4>
                    <p className="text-xs text-brand-slate-500 font-mono">
                      {item.variantName || "Standard"} • SKU: {item.sku}
                    </p>
                    <p className="text-xs text-brand-slate-600 mt-0.5">
                      Quantity: <strong>{item.quantity} unit(s)</strong> × {formatMoney(item.unitPrice)}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-bold text-brand-slate-900 block">
                      {formatMoney(item.refundAmount || item.unitPrice * item.quantity)}
                    </span>
                    {item.conditionOnReturn && (
                      <span className="text-[10px] text-brand-emerald-700 bg-brand-emerald-50 px-2 py-0.5 rounded font-semibold block mt-1">
                        QA: {item.conditionOnReturn}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Event Timeline */}
          <div className="bg-white rounded-3xl border border-brand-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-brand-slate-900 flex items-center gap-2 mb-6">
              <Clock className="w-4 h-4 text-brand-emerald-800" />
              <span>Reverse Logistics & Checkpoint History</span>
            </h3>

            {rma.events && rma.events.length > 0 ? (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-slate-200">
                {rma.events.map((evt, idx) => (
                  <div key={evt.id || idx} className="relative">
                    <div className="absolute -left-6 top-1 w-4 h-4 bg-brand-emerald-800 rounded-full border-2 border-white ring-2 ring-brand-emerald-200" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-brand-slate-900">
                          {evt.title}
                        </span>
                        <span className="text-[10px] font-mono text-brand-slate-400">
                          {new Date(evt.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      </div>
                      {evt.description && (
                        <p className="text-xs text-brand-slate-600 mt-1 leading-relaxed">
                          {evt.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-brand-slate-500">No events logged yet.</p>
            )}
          </div>
        </div>

        {/* Right: Courier & Reason Details */}
        <div className="lg:col-span-4 space-y-6">
          {/* Reverse Courier Card */}
          <div className="bg-white rounded-3xl border border-brand-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-brand-slate-900 flex items-center gap-2 border-b border-brand-slate-100 pb-3">
              <Truck className="w-4 h-4 text-brand-emerald-800" />
              <span>Reverse Courier Pickup</span>
            </h3>

            {rma.reverseAwbNumber ? (
              <div className="space-y-3 text-xs">
                <div className="bg-indigo-50/70 border border-indigo-100 p-3 rounded-xl space-y-1">
                  <span className="text-[11px] text-indigo-700 font-semibold block">
                    Assigned Reverse Waybill
                  </span>
                  <p className="font-mono text-base font-black text-indigo-950">
                    {rma.reverseAwbNumber}
                  </p>
                  <p className="text-[11px] text-indigo-700">
                    Carrier Partner: <strong>{rma.reverseCarrierCode}</strong>
                  </p>
                </div>

                {rma.pickupScheduledDate && (
                  <div className="flex items-center gap-2 text-brand-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-brand-slate-400" />
                    <span>
                      Pickup Scheduled:{" "}
                      <strong>
                        {new Date(rma.pickupScheduledDate).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-brand-slate-500 bg-brand-slate-50 p-4 rounded-xl text-center">
                <Clock className="w-5 h-5 text-brand-slate-400 mx-auto mb-1.5" />
                <p className="font-semibold text-brand-slate-700">Reverse Courier Pending</p>
                <p className="text-[11px] mt-0.5">
                  Courier dispatch will be assigned once vendor confirms pickup slot.
                </p>
              </div>
            )}
          </div>

          {/* Reason & Comments Card */}
          <div className="bg-white rounded-3xl border border-brand-slate-200 p-6 shadow-sm space-y-3 text-xs">
            <h3 className="text-sm font-bold text-brand-slate-900 flex items-center gap-2 border-b border-brand-slate-100 pb-3">
              <FileText className="w-4 h-4 text-brand-emerald-800" />
              <span>Return Information</span>
            </h3>

            <div>
              <span className="text-brand-slate-400 block text-[11px]">Return Reason</span>
              <p className="font-bold text-brand-slate-900 mt-0.5">{rma.reason}</p>
            </div>

            {rma.customerComments && (
              <div>
                <span className="text-brand-slate-400 block text-[11px]">Customer Notes</span>
                <p className="text-brand-slate-700 mt-0.5 italic bg-brand-slate-50 p-2.5 rounded-lg border border-brand-slate-150">
                  &ldquo;{rma.customerComments}&rdquo;
                </p>
              </div>
            )}

            {rma.vendorNotes && (
              <div>
                <span className="text-brand-slate-400 block text-[11px]">Vendor Feedback</span>
                <p className="text-brand-emerald-900 bg-brand-emerald-50/60 p-2.5 rounded-lg border border-brand-emerald-100 mt-0.5">
                  {rma.vendorNotes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
