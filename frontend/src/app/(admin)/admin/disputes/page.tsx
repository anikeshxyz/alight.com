"use client";

import React, { useState } from "react";
import {
  Scale,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  DollarSign,
  User,
  Store,
  Shield,
  ExternalLink,
  ChevronRight,
  Filter,
  Image as ImageIcon,
  MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

type DisputeStatus = "OPEN" | "UNDER_REVIEW" | "EVIDENCE_REQUESTED" | "MEDIATION" | "RESOLVED";
type DisputeType = "DAMAGED_PRODUCT" | "WRONG_PRODUCT" | "RETURN_REJECTED" | "COUNTERFEIT_CLAIM" | "NON_DELIVERY";

interface DisputeRecord {
  id: string;
  orderNumber: string;
  subOrderNumber: string;
  customerName: string;
  customerEmail: string;
  vendorName: string;
  vendorStoreName: string;
  type: DisputeType;
  status: DisputeStatus;
  amount: string;
  createdAt: string;
  customerStatement: string;
  vendorResponse?: string;
  evidenceImages: string[];
  verdict?: "FAVOR_CUSTOMER" | "FAVOR_VENDOR" | "SPLIT_SETTLEMENT";
  resolutionNote?: string;
  refundAdjustment?: string;
  resolvedByAdmin?: string;
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDispute, setSelectedDispute] = useState<DisputeRecord | null>(null);
  const [verdict, setVerdict] = useState<"FAVOR_CUSTOMER" | "FAVOR_VENDOR" | "SPLIT_SETTLEMENT">("FAVOR_CUSTOMER");
  const [resolutionNote, setResolutionNote] = useState("");
  const [refundAdjustment, setRefundAdjustment] = useState("");
  const [notification, setNotification] = useState("");

  const filteredDisputes = disputes.filter((d) => {
    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
    const matchesSearch =
      d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleResolveDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;

    const updated: DisputeRecord = {
      ...selectedDispute,
      status: "RESOLVED",
      verdict,
      resolutionNote,
      refundAdjustment: refundAdjustment || (verdict === "FAVOR_CUSTOMER" ? `Full refund of ${selectedDispute.amount}` : "No financial deduction"),
      resolvedByAdmin: "admin@alight.com",
    };

    setDisputes((prev) =>
      prev.map((d) => (d.id === selectedDispute.id ? updated : d))
    );
    setSelectedDispute(updated);
    setNotification(`Dispute ${selectedDispute.id} arbitrated and ledger adjustment posted.`);
    setTimeout(() => setNotification(""), 4000);
  };

  const handleUpdateStatus = (newStatus: DisputeStatus) => {
    if (!selectedDispute) return;
    const updated: DisputeRecord = {
      ...selectedDispute,
      status: newStatus,
    };
    setDisputes((prev) =>
      prev.map((d) => (d.id === selectedDispute.id ? updated : d))
    );
    setSelectedDispute(updated);
    setNotification(`Dispute ${selectedDispute.id} moved to ${newStatus}`);
    setTimeout(() => setNotification(""), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-brand-gold-400" />
            Marketplace Dispute Arbitration & Mediation
          </h1>
          <p className="text-xs text-brand-slate-400">
            Arbitrate customer-vendor claims, inspect evidence, enforce resolution policies, and post financial ledger adjustments.
          </p>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-700 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-brand-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by dispute ID, order #, buyer, vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-xs text-white placeholder-brand-slate-400 focus:outline-none focus:border-brand-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-xs text-brand-slate-200 focus:outline-none focus:border-brand-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="EVIDENCE_REQUESTED">Evidence Requested</option>
            <option value="MEDIATION">Mediation</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Disputes Table */}
      <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-slate-900/80 text-brand-slate-400 font-semibold border-b border-brand-slate-700">
              <tr>
                <th className="py-3 px-4">Dispute ID & Order</th>
                <th className="py-3 px-4">Claim Type</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4">Dispute Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate-700/50">
              {filteredDisputes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-brand-slate-400">
                    No disputes found matching filter.
                  </td>
                </tr>
              ) : (
                filteredDisputes.map((dsp) => (
                  <tr key={dsp.id} className="hover:bg-brand-slate-750/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{dsp.id}</div>
                      <div className="text-[11px] text-brand-slate-400 mt-0.5">
                        Order: {dsp.orderNumber}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-slate-700 text-brand-slate-300 border border-brand-slate-600">
                        {dsp.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{dsp.customerName}</div>
                      <div className="text-[11px] text-brand-slate-400">{dsp.customerEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{dsp.vendorName}</div>
                      <div className="text-[11px] text-brand-slate-400">{dsp.vendorStoreName}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {dsp.amount}
                    </td>
                    <td className="py-3 px-4">
                      {dsp.status === "RESOLVED" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-700">
                          <CheckCircle className="w-3 h-3" /> Resolved
                        </span>
                      ) : dsp.status === "MEDIATION" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-700">
                          <Clock className="w-3 h-3" /> Mediation
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950/60 text-blue-400 border border-blue-700">
                          {dsp.status.replace("_", " ")}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedDispute(dsp);
                          setVerdict(dsp.verdict || "FAVOR_CUSTOMER");
                          setResolutionNote(dsp.resolutionNote || "");
                          setRefundAdjustment(dsp.refundAdjustment || "");
                        }}
                        className="px-2.5 py-1 bg-brand-slate-700 hover:bg-brand-slate-600 text-brand-slate-200 rounded text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        Arbitrate
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Arbitration Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-slate-850 border border-brand-slate-700 rounded-xl p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-brand-slate-700">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-brand-gold-400" />
                  Dispute Arbitration: {selectedDispute.id}
                </h3>
                <p className="text-[11px] text-brand-slate-400 mt-0.5">
                  Order: {selectedDispute.orderNumber} • Consignment: {selectedDispute.subOrderNumber} • Amount: {selectedDispute.amount}
                </p>
              </div>
              <button
                onClick={() => setSelectedDispute(null)}
                className="text-brand-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Statements Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-brand-slate-900/90 rounded-lg border border-brand-slate-750 space-y-1.5">
                <span className="font-bold text-brand-slate-300 flex items-center gap-1">
                  <User className="w-3 h-3 text-blue-400" />
                  Buyer Statement ({selectedDispute.customerName})
                </span>
                <p className="text-brand-slate-400 text-[11px] leading-relaxed">
                  {selectedDispute.customerStatement}
                </p>
              </div>

              <div className="p-3 bg-brand-slate-900/90 rounded-lg border border-brand-slate-750 space-y-1.5">
                <span className="font-bold text-brand-slate-300 flex items-center gap-1">
                  <Store className="w-3 h-3 text-brand-gold-400" />
                  Vendor Response ({selectedDispute.vendorName})
                </span>
                <p className="text-brand-slate-400 text-[11px] leading-relaxed">
                  {selectedDispute.vendorResponse || "No vendor rebuttal recorded yet."}
                </p>
              </div>
            </div>

            {/* Workflow Stage Controller */}
            {selectedDispute.status !== "RESOLVED" && (
              <div className="p-3 bg-brand-slate-900/60 rounded-lg border border-brand-slate-750 flex items-center justify-between text-xs">
                <span className="text-brand-slate-300 font-medium">Advance Workflow:</span>
                <div className="flex gap-1.5">
                  {(["UNDER_REVIEW", "EVIDENCE_REQUESTED", "MEDIATION"] as DisputeStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(st)}
                      className={`px-2 py-1 rounded text-[10px] font-semibold border ${
                        selectedDispute.status === st
                          ? "bg-brand-emerald-950 text-brand-emerald-300 border-brand-emerald-700"
                          : "bg-brand-slate-800 text-brand-slate-400 border-brand-slate-700 hover:text-white"
                      }`}
                    >
                      {st.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Decision & Financial Ledger Form */}
            {selectedDispute.status === "RESOLVED" ? (
              <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Dispute Formally Resolved ({selectedDispute.verdict?.replace("_", " ")})
                </div>
                <p className="text-brand-slate-300">
                  <strong className="text-white">Admin Finding:</strong> {selectedDispute.resolutionNote}
                </p>
                <p className="text-brand-slate-300">
                  <strong className="text-white">Ledger Adjustment:</strong> {selectedDispute.refundAdjustment}
                </p>
                <div className="text-[10px] text-brand-slate-500 font-mono">
                  Arbitrated by: {selectedDispute.resolvedByAdmin}
                </div>
              </div>
            ) : (
              <form onSubmit={handleResolveDispute} className="space-y-3 pt-2 border-t border-brand-slate-700 text-xs">
                <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Administrative Ruling & Settlement Adjustment
                </h4>

                <div>
                  <label className="block text-brand-slate-300 font-medium mb-1">Arbitration Ruling</label>
                  <select
                    value={verdict}
                    onChange={(e) => setVerdict(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-white focus:outline-none focus:border-brand-emerald-500"
                  >
                    <option value="FAVOR_CUSTOMER">Ruling in Favor of Customer (Full Refund Authorized)</option>
                    <option value="FAVOR_VENDOR">Ruling in Favor of Vendor (Claim Dismissed)</option>
                    <option value="SPLIT_SETTLEMENT">Split Settlement (Partial Refund / Platform Absorbed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-brand-slate-300 font-medium mb-1">Structured Finding & Reasoning</label>
                  <textarea
                    required
                    rows={2}
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Document factual grounds, policy clauses applied, and reason for determination..."
                    className="w-full px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-white focus:outline-none focus:border-brand-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-brand-slate-300 font-medium mb-1">Financial Ledger Adjustment</label>
                  <input
                    type="text"
                    value={refundAdjustment}
                    onChange={(e) => setRefundAdjustment(e.target.value)}
                    placeholder={`e.g. Debit ${selectedDispute.amount} from Vendor Wallet`}
                    className="w-full px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-white focus:outline-none focus:border-brand-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-slate-700">
                  <button
                    type="button"
                    onClick={() => setSelectedDispute(null)}
                    className="px-3 py-1.5 bg-brand-slate-700 text-brand-slate-300 rounded-lg hover:bg-brand-slate-600 font-medium"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-brand-emerald-800 text-white rounded-lg hover:bg-brand-emerald-700 font-semibold"
                  >
                    Issue Final Ruling & Post Adjustment
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
