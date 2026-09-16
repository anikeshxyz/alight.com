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
  Store,
  Settings,
  Plus,
  Trash2,
  Edit2,
} from "lucide-react";
import {
  searchAdminReturnsApi,
  getAdminRmaStatsApi,
  adminOverrideRmaApi,
  getAdminReturnPoliciesApi,
  createAdminReturnPolicyApi,
  updateAdminReturnPolicyApi,
  deleteAdminReturnPolicyApi,
} from "@/services/returns-service";
import {
  RmaRequest,
  RmaStatus,
  RmaStatsSummary,
  RmaPolicy,
  ItemCondition,
  RestockAction,
} from "@/types/returns";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function AdminReturnsPage() {
  const { token } = useAuth();
  const { formatMoney } = useCurrency();

  const [activeTab, setActiveTab] = useState<"RETURNS" | "POLICIES">("RETURNS");
  const [returns, setReturns] = useState<RmaRequest[]>([]);
  const [stats, setStats] = useState<RmaStatsSummary | null>(null);
  const [policies, setPolicies] = useState<RmaPolicy[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Dispute Override Modal
  const [overrideRma, setOverrideRma] = useState<RmaRequest | null>(null);
  const [overridePassed, setOverridePassed] = useState<boolean>(true);
  const [overrideRefundAmt, setOverrideRefundAmt] = useState<number>(0);
  const [overrideNotes, setOverrideNotes] = useState<string>("");
  const [isSubmittingOverride, setIsSubmittingOverride] = useState<boolean>(false);

  // Policy Modal
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState<boolean>(false);
  const [editingPolicy, setEditingPolicy] = useState<RmaPolicy | null>(null);
  const [policyForm, setPolicyForm] = useState<Partial<RmaPolicy>>({
    policyName: "",
    returnWindowDays: 15,
    isReturnable: true,
    restockingFeePercentage: 0,
    requiresApproval: true,
    allowRefund: true,
    allowReplacement: true,
    allowStoreCredit: true,
    termsConditions: "",
  });
  const [isSubmittingPolicy, setIsSubmittingPolicy] = useState<boolean>(false);

  const fetchAdminData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const statusParam = selectedStatus === "ALL" ? undefined : (selectedStatus as RmaStatus);
      const [resReturns, resStats, resPolicies] = await Promise.all([
        searchAdminReturnsApi(token, statusParam, searchTerm, page, 20),
        getAdminRmaStatsApi(token),
        getAdminReturnPoliciesApi(token),
      ]);

      if (resReturns.success && resReturns.data) {
        setReturns(resReturns.data.content || []);
        setTotalPages(resReturns.data.totalPages || 1);
      }
      if (resStats.success && resStats.data) {
        setStats(resStats.data);
      }
      if (resPolicies.success && resPolicies.data) {
        setPolicies(resPolicies.data);
      }
    } catch (e) {
      console.error("Failed to load admin returns data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token, selectedStatus, page, searchTerm]);

  const handleOpenOverride = (rma: RmaRequest) => {
    setOverrideRma(rma);
    setOverridePassed(true);
    setOverrideRefundAmt(rma.netRefundAmount || rma.refundAmount);
    setOverrideNotes("");
  };

  const handleOverrideSubmit = async () => {
    if (!token || !overrideRma) return;
    setIsSubmittingOverride(true);
    try {
      const itemsPayload = overrideRma.items.map((i) => ({
        rmaItemId: i.id,
        condition: "UNOPENED" as ItemCondition,
        restockAction: "RESTOCK_AVAILABLE" as RestockAction,
        notes: "Admin dispute arbitration",
      }));

      const res = await adminOverrideRmaApi(
        overrideRma.id,
        {
          inspectionPassed: overridePassed,
          inspectionNotes: overrideNotes,
          customRefundAmount: overrideRefundAmt,
          items: itemsPayload,
        },
        token
      );

      if (res.success) {
        setOverrideRma(null);
        fetchAdminData();
      } else {
        alert(res.message || "Failed to execute dispute override");
      }
    } catch (e: any) {
      alert(e.message || "Error during dispute override");
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  const handleSavePolicy = async () => {
    if (!token) return;
    if (!policyForm.policyName) {
      alert("Policy name is required");
      return;
    }

    setIsSubmittingPolicy(true);
    try {
      let res;
      if (editingPolicy) {
        res = await updateAdminReturnPolicyApi(editingPolicy.id, policyForm, token);
      } else {
        res = await createAdminReturnPolicyApi(policyForm, token);
      }

      if (res.success) {
        setIsPolicyModalOpen(false);
        setEditingPolicy(null);
        fetchAdminData();
      } else {
        alert(res.message || "Failed to save policy");
      }
    } catch (e: any) {
      alert(e.message || "Error saving policy");
    } finally {
      setIsSubmittingPolicy(false);
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (!token) return;
    if (!confirm("Are you sure you want to delete this return policy?")) return;
    try {
      const res = await deleteAdminReturnPolicyApi(id, token);
      if (res.success) {
        fetchAdminData();
      } else {
        alert(res.message || "Failed to delete policy");
      }
    } catch (e: any) {
      alert(e.message || "Error deleting policy");
    }
  };

  const getRmaStatusBadge = (status: RmaStatus) => {
    switch (status) {
      case "REQUESTED":
        return <Badge variant="warning">Requested</Badge>;
      case "APPROVED":
        return <Badge variant="info">Approved</Badge>;
      case "PICKUP_SCHEDULED":
      case "IN_REVERSE_TRANSIT":
        return <Badge variant="brand">Reverse Transit</Badge>;
      case "RECEIVED_AT_WAREHOUSE":
        return <Badge variant="info">At Warehouse</Badge>;
      case "REFUND_PROCESSED":
        return <Badge variant="success">Refund Settled</Badge>;
      case "REPLACEMENT_DISPATCHED":
        return <Badge variant="success">Replacement Sent</Badge>;
      case "REJECTED":
      case "INSPECTED_FAIL":
        return <Badge variant="danger">Rejected / Failed</Badge>;
      case "CANCELLED":
        return <Badge variant="neutral">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-brand-emerald-800">
              Admin Operations Desk
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-slate-900 tracking-tight flex items-center gap-2.5 mt-1">
            <RotateCcw className="w-7 h-7 text-brand-emerald-800" />
            <span>Marketplace Returns & Dispute Arbitration</span>
          </h1>
          <p className="text-xs sm:text-sm text-brand-slate-500 mt-1">
            Oversee customer return authorizations, mediate vendor disputes, manage category return policies, and trigger force refunds.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-brand-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-brand-slate-200">
          <button
            onClick={() => setActiveTab("RETURNS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "RETURNS"
                ? "bg-white text-brand-slate-900 shadow-sm"
                : "text-brand-slate-600 hover:text-brand-slate-900"
            }`}
          >
            All Returns Queue
          </button>
          <button
            onClick={() => setActiveTab("POLICIES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "POLICIES"
                ? "bg-white text-brand-slate-900 shadow-sm"
                : "text-brand-slate-600 hover:text-brand-slate-900"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Return Policies</span>
          </button>
        </div>
      </div>

      {activeTab === "RETURNS" ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-brand-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-slate-400 block">Total RMAs</span>
              <p className="text-2xl font-black text-brand-slate-900 mt-1">{stats?.totalRequests || 0}</p>
            </div>
            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">Review Pending</span>
              <p className="text-2xl font-black text-amber-900 mt-1">{stats?.pendingReview || 0}</p>
            </div>
            <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block">Reverse Transit</span>
              <p className="text-2xl font-black text-indigo-900 mt-1">{stats?.inTransit || 0}</p>
            </div>
            <div className="bg-sky-50/70 p-4 rounded-2xl border border-sky-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 block">Awaiting QA</span>
              <p className="text-2xl font-black text-sky-900 mt-1">{stats?.awaitingInspection || 0}</p>
            </div>
            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">Settled / Refunded</span>
              <p className="text-2xl font-black text-emerald-900 mt-1">{stats?.completedRefunded || 0}</p>
            </div>
            <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">Rejected</span>
              <p className="text-2xl font-black text-rose-900 mt-1">{stats?.rejected || 0}</p>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-3xl border border-brand-slate-200 p-4 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { label: "All", value: "ALL" },
                  { label: "Requested", value: "REQUESTED" },
                  { label: "Approved", value: "APPROVED" },
                  { label: "In Transit", value: "PICKUP_SCHEDULED" },
                  { label: "At Warehouse", value: "RECEIVED_AT_WAREHOUSE" },
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
                  placeholder="Search RMA, Customer, Vendor, AWB..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-brand-slate-50 border border-brand-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-brand-emerald-800 border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs text-brand-slate-500 font-medium">Loading marketplace RMA records...</span>
              </div>
            ) : returns.length === 0 ? (
              <div className="py-12 text-center text-brand-slate-400">
                <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold text-brand-slate-700">No return requests found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-brand-slate-200 bg-brand-slate-50/70 text-brand-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3">RMA Reference</th>
                      <th className="p-3">Vendor / Store</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3">Refund Value</th>
                      <th className="p-3">Reverse Carrier</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Dispute Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-slate-100 font-medium">
                    {returns.map((rma) => (
                      <tr key={rma.id} className="hover:bg-brand-slate-50/60 transition">
                        <td className="p-3">
                          <span className="font-mono font-bold text-brand-emerald-950 block">
                            {rma.rmaNumber}
                          </span>
                          <span className="font-mono text-[11px] text-brand-slate-500 block">
                            {rma.orderNumber}
                          </span>
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-brand-slate-900">{rma.vendorStoreName}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-brand-slate-900">{rma.customerName}</p>
                          <p className="text-[11px] text-brand-slate-500">{rma.customerEmail}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-brand-slate-800">{rma.reason}</p>
                          <p className="text-[10px] text-brand-slate-500">{rma.returnType}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-brand-slate-900">
                            {formatMoney(rma.netRefundAmount || rma.refundAmount)}
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
                            <span className="text-[11px] text-brand-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="p-3">
                          {getRmaStatusBadge(rma.status)}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenOverride(rma)}
                              className="text-[11px] px-2.5 py-1 text-amber-800 bg-amber-50/70 border-amber-200 font-semibold"
                            >
                              Arbitrate / Override
                            </Button>
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
        </>
      ) : (
        /* Return Policies Management Tab */
        <div className="bg-white rounded-3xl border border-brand-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-brand-slate-900">Category & Store Return Policies</h3>
              <p className="text-xs text-brand-slate-500 mt-0.5">
                Configure return windows, restocking fee deductions, and resolution eligibility per category.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingPolicy(null);
                setPolicyForm({
                  policyName: "",
                  returnWindowDays: 15,
                  isReturnable: true,
                  restockingFeePercentage: 0,
                  requiresApproval: true,
                  allowRefund: true,
                  allowReplacement: true,
                  allowStoreCredit: true,
                  termsConditions: "",
                });
                setIsPolicyModalOpen(true);
              }}
              className="text-xs font-semibold gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Return Policy</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {policies.map((p) => (
              <div
                key={p.id}
                className="bg-brand-slate-50/60 rounded-2xl border border-brand-slate-200 p-5 space-y-3 relative hover:shadow-sm transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-brand-slate-900">{p.policyName}</h4>
                    <p className="text-xs text-brand-emerald-800 font-semibold mt-0.5">
                      {p.categoryName ? `Category: ${p.categoryName}` : p.vendorName ? `Vendor: ${p.vendorName}` : "Global Default Rule"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingPolicy(p);
                        setPolicyForm(p);
                        setIsPolicyModalOpen(true);
                      }}
                      className="p-1.5 text-brand-slate-400 hover:text-brand-slate-600 rounded-lg hover:bg-brand-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePolicy(p.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-brand-slate-600">
                  <p>
                    Return Window: <strong>{p.returnWindowDays} Days</strong>
                  </p>
                  <p>
                    Restocking Fee: <strong>{p.restockingFeePercentage}%</strong>
                  </p>
                  <p>
                    Returnable:{" "}
                    <strong className={p.isReturnable ? "text-emerald-700" : "text-rose-700"}>
                      {p.isReturnable ? "Yes" : "Non-Returnable"}
                    </strong>
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {p.allowRefund && <span className="bg-white border px-2 py-0.5 rounded text-[10px] font-semibold text-brand-slate-700">Refund</span>}
                    {p.allowReplacement && <span className="bg-white border px-2 py-0.5 rounded text-[10px] font-semibold text-brand-slate-700">Replacement</span>}
                    {p.allowStoreCredit && <span className="bg-white border px-2 py-0.5 rounded text-[10px] font-semibold text-brand-slate-700">Credit</span>}
                  </div>
                </div>

                {p.termsConditions && (
                  <p className="text-[11px] text-brand-slate-500 italic bg-white p-2 rounded-lg border border-brand-slate-150">
                    {p.termsConditions}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Dispute Override Modal */}
      {overrideRma && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-brand-slate-200 space-y-5">
            <div>
              <span className="text-xs uppercase font-bold text-amber-700 tracking-wider">
                Admin Dispute Mediation
              </span>
              <h3 className="text-xl font-black text-brand-slate-900 mt-1">
                Arbitrate {overrideRma.rmaNumber}
              </h3>
              <p className="text-xs text-brand-slate-500 mt-0.5">
                Vendor: {overrideRma.vendorStoreName} • Customer: {overrideRma.customerName}
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOverridePassed(true)}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    overridePassed
                      ? "bg-emerald-50 border-emerald-600 text-emerald-800 ring-2 ring-emerald-200"
                      : "bg-white border-brand-slate-200 text-brand-slate-600"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Force Approve & Refund</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOverridePassed(false)}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    !overridePassed
                      ? "bg-rose-50 border-rose-600 text-rose-800 ring-2 ring-rose-200"
                      : "bg-white border-brand-slate-200 text-brand-slate-600"
                  }`}
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Reject & Close Dispute</span>
                </button>
              </div>

              {overridePassed && (
                <div>
                  <label className="block text-xs font-bold text-brand-slate-700 mb-1">
                    Arbitrated Refund Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={overrideRefundAmt}
                    onChange={(e) => setOverrideRefundAmt(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-brand-slate-300 rounded-xl px-3 py-2 text-xs text-brand-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-brand-slate-700 mb-1">
                  Arbitration Rationale & Notes
                </label>
                <textarea
                  rows={3}
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  placeholder="Record justification for escrow clawback or rejection..."
                  className="w-full bg-white border border-brand-slate-300 rounded-xl px-3 py-2 text-xs text-brand-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOverrideRma(null)}
                disabled={isSubmittingOverride}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOverrideSubmit}
                isLoading={isSubmittingOverride}
              >
                Execute Dispute Resolution
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Policy Create / Edit Modal */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-brand-slate-200 relative my-8 space-y-4">
            <div>
              <span className="text-xs uppercase font-bold text-brand-emerald-800 tracking-wider">
                Policy Configuration
              </span>
              <h3 className="text-xl font-black text-brand-slate-900 mt-1">
                {editingPolicy ? "Edit Return Policy" : "Create New Return Policy"}
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-brand-slate-700 mb-1">
                  Policy Name *
                </label>
                <input
                  type="text"
                  value={policyForm.policyName || ""}
                  onChange={(e) => setPolicyForm({ ...policyForm, policyName: e.target.value })}
                  placeholder="e.g. Architectural Hardware 30-Day Policy"
                  className="w-full bg-white border border-brand-slate-300 rounded-xl px-3 py-2 text-xs text-brand-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-brand-slate-700 mb-1">
                    Return Window (Days) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={policyForm.returnWindowDays || 15}
                    onChange={(e) => setPolicyForm({ ...policyForm, returnWindowDays: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white border border-brand-slate-300 rounded-xl px-3 py-2 text-xs text-brand-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-slate-700 mb-1">
                    Restock Fee (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={policyForm.restockingFeePercentage || 0}
                    onChange={(e) => setPolicyForm({ ...policyForm, restockingFeePercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-brand-slate-300 rounded-xl px-3 py-2 text-xs text-brand-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-slate-700 mb-1">
                  Policy Terms & Conditions
                </label>
                <textarea
                  rows={3}
                  value={policyForm.termsConditions || ""}
                  onChange={(e) => setPolicyForm({ ...policyForm, termsConditions: e.target.value })}
                  placeholder="Conditions for packaging, original seals, accessories..."
                  className="w-full bg-white border border-brand-slate-300 rounded-xl px-3 py-2 text-xs text-brand-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-emerald-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPolicyModalOpen(false)}
                disabled={isSubmittingPolicy}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSavePolicy}
                isLoading={isSubmittingPolicy}
              >
                Save Return Policy
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
