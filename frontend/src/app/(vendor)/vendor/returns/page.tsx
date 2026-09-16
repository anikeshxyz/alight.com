"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  RotateCcw,
  Package,
  Calendar,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Check,
  Building2,
  Warehouse,
} from "lucide-react";
import {
  getVendorReturnsApi,
  getVendorRmaStatsApi,
  reviewVendorRmaApi,
  scheduleReversePickupApi,
  inspectVendorRmaApi,
} from "@/services/returns-service";
import {
  RmaRequest,
  RmaStatus,
  RmaStatsSummary,
  ItemCondition,
  RestockAction,
} from "@/types/returns";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function VendorReturnsPage() {
  const { token } = useAuth();
  const { formatMoney } = useCurrency();

  const [returns, setReturns] = useState<RmaRequest[]>([]);
  const [stats, setStats] = useState<RmaStatsSummary | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Review Modal State
  const [selectedRmaForReview, setSelectedRmaForReview] = useState<RmaRequest | null>(null);
  const [reviewDecision, setReviewDecision] = useState<boolean>(true);
  const [reviewNotes, setReviewNotes] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Pickup Modal State
  const [selectedRmaForPickup, setSelectedRmaForPickup] = useState<RmaRequest | null>(null);
  const [pickupCarrier, setPickupCarrier] = useState<string>("BLUEDART");
  const [pickupDate, setPickupDate] = useState<string>("");
  const [pickupNotes, setPickupNotes] = useState<string>("");
  const [isSubmittingPickup, setIsSubmittingPickup] = useState<boolean>(false);

  // Inspection Modal State
  const [selectedRmaForInspection, setSelectedRmaForInspection] = useState<RmaRequest | null>(null);
  const [inspectionPassed, setInspectionPassed] = useState<boolean>(true);
  const [inspectionNotes, setInspectionNotes] = useState<string>("");
  const [restockFee, setRestockFee] = useState<number>(0);
  const [itemConditions, setItemConditions] = useState<{
    [itemId: string]: { condition: ItemCondition; action: RestockAction; notes: string };
  }>({});
  const [isSubmittingInspection, setIsSubmittingInspection] = useState<boolean>(false);

  const fetchReturns = React.useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const statusParam = selectedStatus === "ALL" ? undefined : (selectedStatus as RmaStatus);
      const [resReturns, resStats] = await Promise.all([
        getVendorReturnsApi(token, statusParam, page, 15),
        getVendorRmaStatsApi(token),
      ]);

      if (resReturns.success && resReturns.data) {
        setReturns(resReturns.data.content || []);
        setTotalPages(resReturns.data.totalPages || 1);
      }
      if (resStats.success && resStats.data) {
        setStats(resStats.data);
      }
    } catch (e) {
      console.error("Failed to load vendor returns:", e);
    } finally {
      setIsLoading(false);
    }
  }, [token, selectedStatus, page]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const handleReviewSubmit = async () => {
    if (!token || !selectedRmaForReview) return;
    setIsSubmittingReview(true);
    try {
      const res = await reviewVendorRmaApi(
        selectedRmaForReview.id,
        { approved: reviewDecision, reviewNotes },
        token
      );
      if (res.success) {
        setSelectedRmaForReview(null);
        fetchReturns();
      } else {
        alert(res.message || "Failed to update review status");
      }
    } catch (e: any) {
      alert(e.message || "Error submitting review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handlePickupSubmit = async () => {
    if (!token || !selectedRmaForPickup) return;
    setIsSubmittingPickup(true);
    try {
      const res = await scheduleReversePickupApi(
        selectedRmaForPickup.id,
        {
          carrierCode: pickupCarrier,
          scheduledDate: pickupDate ? new Date(pickupDate).toISOString() : undefined,
          notes: pickupNotes,
        },
        token
      );
      if (res.success) {
        setSelectedRmaForPickup(null);
        fetchReturns();
      } else {
        alert(res.message || "Failed to schedule pickup");
      }
    } catch (e: any) {
      alert(e.message || "Error scheduling pickup");
    } finally {
      setIsSubmittingPickup(false);
    }
  };

  const openInspectionModal = (rma: RmaRequest) => {
    setSelectedRmaForInspection(rma);
    const initial: { [itemId: string]: { condition: ItemCondition; action: RestockAction; notes: string } } = {};
    rma.items.forEach((i) => {
      initial[i.id] = {
        condition: "UNOPENED",
        action: "RESTOCK_AVAILABLE",
        notes: "Inspected and verified good for inventory restock.",
      };
    });
    setItemConditions(initial);
    setInspectionPassed(true);
    setInspectionNotes("");
    setRestockFee(0);
  };

  const handleInspectionSubmit = async () => {
    if (!token || !selectedRmaForInspection) return;
    setIsSubmittingInspection(true);
    try {
      const itemsPayload = selectedRmaForInspection.items.map((i) => {
        const itemState = itemConditions[i.id] || {
          condition: "UNOPENED" as ItemCondition,
          action: "RESTOCK_AVAILABLE" as RestockAction,
          notes: "",
        };
        return {
          rmaItemId: i.id,
          condition: itemState.condition,
          restockAction: itemState.action,
          notes: itemState.notes,
        };
      });

      const res = await inspectVendorRmaApi(
        selectedRmaForInspection.id,
        {
          inspectionPassed,
          inspectionNotes,
          restockFee,
          items: itemsPayload,
        },
        token
      );

      if (res.success) {
        setSelectedRmaForInspection(null);
        fetchReturns();
      } else {
        alert(res.message || "Failed to submit QA inspection");
      }
    } catch (e: any) {
      alert(e.message || "Error submitting QA inspection");
    } finally {
      setIsSubmittingInspection(false);
    }
  };

  const getRmaStatusBadge = (status: RmaStatus) => {
    switch (status) {
      case "REQUESTED":
        return <Badge variant="warning">Action Required (Review)</Badge>;
      case "APPROVED":
        return <Badge variant="info">Approved (Pending Dispatch)</Badge>;
      case "PICKUP_SCHEDULED":
      case "IN_REVERSE_TRANSIT":
        return <Badge variant="brand">Reverse Transit</Badge>;
      case "RECEIVED_AT_WAREHOUSE":
        return <Badge variant="info">Inward Received (QA Pending)</Badge>;
      case "REFUND_PROCESSED":
        return <Badge variant="success">Refund Settled</Badge>;
      case "REPLACEMENT_DISPATCHED":
        return <Badge variant="success">Replacement Sent</Badge>;
      case "REJECTED":
      case "INSPECTED_FAIL":
        return <Badge variant="danger">Rejected / Failed QA</Badge>;
      case "CANCELLED":
        return <Badge variant="neutral">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const filteredReturns = returns.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.rmaNumber.toLowerCase().includes(term) ||
      r.orderNumber.toLowerCase().includes(term) ||
      r.customerName.toLowerCase().includes(term) ||
      (r.reverseAwbNumber && r.reverseAwbNumber.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-brand-emerald-800">
              Vendor Fulfillment & RMAs
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-slate-900 tracking-tight flex items-center gap-2.5 mt-1">
            <RotateCcw className="w-7 h-7 text-brand-emerald-800" />
            <span>Returns & Reverse Logistics Desk</span>
          </h1>
          <p className="text-xs sm:text-sm text-brand-slate-500 mt-1">
            Review customer return authorizations, schedule reverse courier pickups, conduct warehouse QA inspections, and restock units.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-brand-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-slate-400 block">Total RMAs</span>
          <p className="text-2xl font-black text-brand-slate-900 mt-1">{stats?.totalRequests || 0}</p>
        </div>
        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">Pending Review</span>
          <p className="text-2xl font-black text-amber-900 mt-1">{stats?.pendingReview || 0}</p>
        </div>
        <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block">In Transit</span>
          <p className="text-2xl font-black text-indigo-900 mt-1">{stats?.inTransit || 0}</p>
        </div>
        <div className="bg-sky-50/70 p-4 rounded-2xl border border-sky-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 block">Awaiting QA</span>
          <p className="text-2xl font-black text-sky-900 mt-1">{stats?.awaitingInspection || 0}</p>
        </div>
        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">Refunded</span>
          <p className="text-2xl font-black text-emerald-900 mt-1">{stats?.completedRefunded || 0}</p>
        </div>
        <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">Rejected</span>
          <p className="text-2xl font-black text-rose-900 mt-1">{stats?.rejected || 0}</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-3xl border border-brand-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { label: "All Returns", value: "ALL" },
              { label: "Needs Review", value: "REQUESTED" },
              { label: "Approved", value: "APPROVED" },
              { label: "Pickup Scheduled", value: "PICKUP_SCHEDULED" },
              { label: "Received (QA)", value: "RECEIVED_AT_WAREHOUSE" },
              { label: "Refunded", value: "REFUND_PROCESSED" },
              { label: "Rejected", value: "REJECTED" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setSelectedStatus(tab.value);
                  setPage(0);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedStatus === tab.value
                    ? "bg-brand-emerald-800 text-white shadow-sm"
                    : "bg-brand-slate-100 text-brand-slate-600 hover:bg-brand-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-brand-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search RMA, Order, AWB..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-brand-slate-50 border border-brand-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
            />
          </div>
        </div>

        {/* Returns Table */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-brand-emerald-800 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs text-brand-slate-500 font-medium">Loading RMA records...</span>
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="py-12 text-center text-brand-slate-400">
            <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-brand-slate-700">No return requests found</p>
            <p className="text-xs text-brand-slate-400 mt-0.5">There are no RMAs matching this status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-slate-200 bg-brand-slate-50/70 text-brand-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3">RMA & Order</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Reason & Resolution</th>
                  <th className="p-3">Items & Value</th>
                  <th className="p-3">Reverse Courier</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-slate-100 font-medium">
                {filteredReturns.map((rma) => (
                  <tr key={rma.id} className="hover:bg-brand-slate-50/60 transition">
                    <td className="p-3">
                      <span className="font-mono font-bold text-brand-emerald-950 block">
                        {rma.rmaNumber}
                      </span>
                      <span className="font-mono text-[11px] text-brand-slate-500 block">
                        {rma.subOrderNumber}
                      </span>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-brand-slate-900">{rma.customerName}</p>
                      <p className="text-[11px] text-brand-slate-500">{rma.customerEmail}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-brand-slate-800">{rma.reason}</p>
                      <p className="text-[10px] text-brand-slate-500 uppercase tracking-wider font-semibold">
                        Type: {rma.returnType}
                      </p>
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-brand-slate-900">
                        {formatMoney(rma.netRefundAmount || rma.refundAmount)}
                      </p>
                      <p className="text-[11px] text-brand-slate-500">
                        {rma.items?.length || 0} line item(s)
                      </p>
                    </td>
                    <td className="p-3">
                      {rma.reverseAwbNumber ? (
                        <div>
                          <span className="font-mono font-bold text-indigo-700 block">
                            {rma.reverseAwbNumber}
                          </span>
                          <span className="text-[10px] text-brand-slate-500 block">
                            {rma.reverseCarrierCode}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-brand-slate-400 italic">Not Assigned</span>
                      )}
                    </td>
                    <td className="p-3">
                      {getRmaStatusBadge(rma.status)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {rma.status === "REQUESTED" && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setSelectedRmaForReview(rma);
                              setReviewDecision(true);
                              setReviewNotes("");
                            }}
                            className="text-[11px] px-2.5 py-1 font-semibold"
                          >
                            Review & Decide
                          </Button>
                        )}

                        {rma.status === "APPROVED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRmaForPickup(rma);
                              setPickupCarrier("BLUEDART");
                              setPickupNotes("");
                            }}
                            className="text-[11px] px-2.5 py-1 text-indigo-700 bg-indigo-50/70 border-indigo-200 font-semibold"
                          >
                            Schedule Pickup
                          </Button>
                        )}

                        {(rma.status === "RECEIVED_AT_WAREHOUSE" || rma.status === "PICKUP_SCHEDULED" || rma.status === "IN_REVERSE_TRANSIT") && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openInspectionModal(rma)}
                            className="text-[11px] px-2.5 py-1 font-semibold bg-sky-700 hover:bg-sky-800"
                          >
                            QA Inspection
                          </Button>
                        )}

                        <Link href={`/account/returns/${rma.rmaNumber}`} target="_blank">
                          <Button variant="ghost" size="sm" className="text-[11px] p-1.5 text-brand-slate-500">
                            <FileText className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedRmaForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-brand-slate-200 space-y-5">
            <div>
              <span className="text-xs uppercase font-bold text-brand-emerald-800 tracking-wider">
                Vendor RMA Review
              </span>
              <h3 className="text-xl font-black text-brand-slate-900 mt-1">
                Review {selectedRmaForReview.rmaNumber}
              </h3>
              <p className="text-xs text-brand-slate-500 mt-0.5">
                Customer: {selectedRmaForReview.customerName} ({selectedRmaForReview.customerEmail})
              </p>
            </div>

            <div className="bg-brand-slate-50 p-3.5 rounded-2xl text-xs space-y-1 border border-brand-slate-200">
              <p>
                <strong>Reason:</strong> {selectedRmaForReview.reason}
              </p>
              <p>
                <strong>Requested Resolution:</strong> {selectedRmaForReview.returnType}
              </p>
              {selectedRmaForReview.customerComments && (
                <p className="italic text-brand-slate-600 mt-1">
                  &ldquo;{selectedRmaForReview.customerComments}&rdquo;
                </p>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-brand-slate-700">Decision *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReviewDecision(true)}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    reviewDecision
                      ? "bg-emerald-50 border-emerald-600 text-emerald-800 ring-2 ring-emerald-200"
                      : "bg-white border-brand-slate-200 text-brand-slate-600 hover:bg-brand-slate-50"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Approve Return</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewDecision(false)}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    !reviewDecision
                      ? "bg-rose-50 border-rose-600 text-rose-800 ring-2 ring-rose-200"
                      : "bg-white border-brand-slate-200 text-brand-slate-600 hover:bg-brand-slate-50"
                  }`}
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Reject Return</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-slate-700 mb-1">
                  Vendor Review Notes
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Provide instructions to customer or reason for rejection..."
                  className="w-full bg-white border border-brand-slate-300 rounded-xl px-3 py-2 text-xs text-brand-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRmaForReview(null)}
                disabled={isSubmittingReview}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleReviewSubmit}
                isLoading={isSubmittingReview}
              >
                Confirm Decision
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pickup Schedule Modal */}
      {selectedRmaForPickup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-brand-slate-200 space-y-5">
            <div>
              <span className="text-xs uppercase font-bold text-indigo-700 tracking-wider">
                Reverse Logistics Dispatch
              </span>
              <h3 className="text-xl font-black text-brand-slate-900 mt-1">
                Book Courier Pickup for {selectedRmaForPickup.rmaNumber}
              </h3>
              <p className="text-xs text-brand-slate-500 mt-0.5">
                Automatically allocate reverse AWB and notify customer of scheduled pickup.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-slate-700 mb-1">
                  Select Reverse Logistics Carrier *
                </label>
                <select
                  value={pickupCarrier}
                  onChange={(e) => setPickupCarrier(e.target.value)}
                  className="w-full bg-white border border-brand-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-brand-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                >
                  <option value="BLUEDART">Blue Dart Reverse Surface (Standard)</option>
                  <option value="DELHIVERY">Delhivery Reverse Express</option>
                  <option value="SHIPROCKET">Shiprocket Reverse Fulfillment</option>
                  <option value="DTDC">DTDC Reverse Cargo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-slate-700 mb-1">
                  Preferred Pickup Date
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full bg-white border border-brand-slate-300 rounded-xl px-3 py-2 text-xs text-brand-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-slate-700 mb-1">
                  Pickup Instructions / Dispatch Notes
                </label>
                <textarea
                  rows={2}
                  value={pickupNotes}
                  onChange={(e) => setPickupNotes(e.target.value)}
                  placeholder="Gate pass instructions, special package sealing rules..."
                  className="w-full bg-white border border-brand-slate-300 rounded-xl px-3 py-2 text-xs text-brand-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRmaForPickup(null)}
                disabled={isSubmittingPickup}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePickupSubmit}
                isLoading={isSubmittingPickup}
              >
                Generate Reverse AWB & Schedule
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* QA Warehouse Inspection Modal */}
      {selectedRmaForInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-brand-slate-200 relative my-8 space-y-5">
            <div>
              <span className="text-xs uppercase font-bold text-sky-800 tracking-wider">
                Warehouse Inward QA Inspection
              </span>
              <h3 className="text-xl font-black text-brand-slate-900 mt-1">
                Inspect Return {selectedRmaForInspection.rmaNumber}
              </h3>
              <p className="text-xs text-brand-slate-500 mt-0.5">
                Verify returned unit physical condition, assign restock action, and trigger automated inventory / escrow refund settlement.
              </p>
            </div>

            {/* Overall Decision */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setInspectionPassed(true)}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                  inspectionPassed
                    ? "bg-emerald-50 border-emerald-600 text-emerald-800 ring-2 ring-emerald-200"
                    : "bg-white border-brand-slate-200 text-brand-slate-600 hover:bg-brand-slate-50"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Inspection Passed (Approve Refund)</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectionPassed(false)}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                  !inspectionPassed
                    ? "bg-rose-50 border-rose-600 text-rose-800 ring-2 ring-rose-200"
                    : "bg-white border-brand-slate-200 text-brand-slate-600 hover:bg-brand-slate-50"
                }`}
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Inspection Failed (Void Return)</span>
              </button>
            </div>

            {/* Line Items Condition Review */}
            <div className="border border-brand-slate-200 rounded-2xl p-4 bg-brand-slate-50/50 space-y-4">
              <span className="text-xs font-bold text-brand-slate-800 block">
                Item-by-Item QA & Restock Disposition:
              </span>

              {selectedRmaForInspection.items.map((item) => {
                const current = itemConditions[item.id] || {
                  condition: "UNOPENED",
                  action: "RESTOCK_AVAILABLE",
                  notes: "",
                };

                return (
                  <div key={item.id} className="bg-white p-3.5 rounded-xl border border-brand-slate-200 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-brand-slate-900">{item.productTitle}</p>
                        <p className="text-[11px] text-brand-slate-500 font-mono">
                          Qty: {item.quantity} • Value: {formatMoney(item.unitPrice * item.quantity)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-brand-slate-600 mb-1">
                          Received Condition
                        </label>
                        <select
                          value={current.condition}
                          onChange={(e) =>
                            setItemConditions({
                              ...itemConditions,
                              [item.id]: { ...current, condition: e.target.value as ItemCondition },
                            })
                          }
                          className="w-full bg-brand-slate-50 border border-brand-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-brand-slate-800 font-medium"
                        >
                          <option value="UNOPENED">Unopened (Factory Mint Sealed)</option>
                          <option value="OPENED_UNUSED">Opened / Inspected (Unused)</option>
                          <option value="DEFECTIVE_FACTORY">Factory Defect Verified</option>
                          <option value="DAMAGED_USER">Damaged by Customer</option>
                          <option value="SCRAP">Scrap / Total Loss</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-brand-slate-600 mb-1">
                          Restock Action
                        </label>
                        <select
                          value={current.action}
                          onChange={(e) =>
                            setItemConditions({
                              ...itemConditions,
                              [item.id]: { ...current, action: e.target.value as RestockAction },
                            })
                          }
                          className="w-full bg-brand-slate-50 border border-brand-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-brand-slate-800 font-medium"
                        >
                          <option value="RESTOCK_AVAILABLE">Restock to Available Inventory</option>
                          <option value="RESTOCK_DAMAGED">Hold in Quarantine Warehouse</option>
                          <option value="DISCARD_SCRAP">Write Off & Discard (No Restock)</option>
                          <option value="NONE">None</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Restock Fee & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-slate-700 mb-1">
                  Restocking Fee Deduction (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={restockFee}
                  onChange={(e) => setRestockFee(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-brand-slate-300 rounded-xl px-3 py-2 text-xs text-brand-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-slate-700 mb-1">
                  QA Inspection Summary Notes
                </label>
                <input
                  type="text"
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="Seals checked, runners tested, repackaged..."
                  className="w-full bg-white border border-brand-slate-300 rounded-xl px-3 py-2 text-xs text-brand-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRmaForInspection(null)}
                disabled={isSubmittingInspection}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleInspectionSubmit}
                isLoading={isSubmittingInspection}
              >
                Complete QA & Restock Units
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
