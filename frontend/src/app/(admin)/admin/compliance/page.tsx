"use client";

import React, { useState, useEffect } from "react";
import {
  FileCheck,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  Download,
  Filter,
  ShieldCheck,
  FileText,
  Building2,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

type DocType = "GST_CERTIFICATE" | "PAN_CARD" | "BANK_STATEMENT" | "BIS_CERTIFICATE" | "BRAND_AUTHORIZATION";
type DocStatus = "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED";

interface ComplianceDocument {
  id: string;
  vendorName: string;
  storeName: string;
  docType: DocType;
  docNumber: string;
  fileUrl: string;
  status: DocStatus;
  submittedAt: string;
  expiryDate?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

export default function AdminCompliancePage() {
  const [docs, setDocs] = useState<ComplianceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedDoc, setSelectedDoc] = useState<ComplianceDocument | null>(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [notification, setNotification] = useState("");

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("alight_token") || "" : "";
        if (!token) {
          setDocs([]);
          return;
        }
        const { adminListVendorsApi } = await import("@/services/vendor-service");
        const res = await adminListVendorsApi(token, undefined, undefined, 0, 50);
        if (res.success && res.data && res.data.content) {
          const realDocs: ComplianceDocument[] = [];
          res.data.content.forEach((v) => {
            if (v.businessDetails?.taxIdGstin) {
              realDocs.push({
                id: `DOC-GST-${v.id}`,
                vendorName: v.businessDetails.legalBusinessName || v.storeName,
                storeName: v.storeName,
                docType: "GST_CERTIFICATE",
                docNumber: v.businessDetails.taxIdGstin,
                fileUrl: "#",
                status: v.businessDetails?.verified ? "VERIFIED" : v.status === "REJECTED" ? "REJECTED" : "PENDING",
                submittedAt: v.createdAt || new Date().toISOString(),
              });
            }
            if (v.businessDetails?.panNumber) {
              realDocs.push({
                id: `DOC-PAN-${v.id}`,
                vendorName: v.businessDetails.legalBusinessName || v.storeName,
                storeName: v.storeName,
                docType: "PAN_CARD",
                docNumber: v.businessDetails.panNumber,
                fileUrl: "#",
                status: v.businessDetails?.verified ? "VERIFIED" : v.status === "REJECTED" ? "REJECTED" : "PENDING",
                submittedAt: v.createdAt || new Date().toISOString(),
              });
            }
          });
          setDocs(realDocs);
        }
      } catch (err) {
        console.error("Failed to load compliance documents", err);
        setDocs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const filteredDocs = docs.filter((d) => {
    const matchesSearch =
      d.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.docNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
    const matchesType = typeFilter === "ALL" || d.docType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleApprove = (doc: ComplianceDocument) => {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === doc.id
          ? { ...d, status: "VERIFIED", verifiedBy: "admin@alight.com" }
          : d
      )
    );
    setNotification(`Document ${doc.docNumber} verified and approved`);
    setTimeout(() => setNotification(""), 3000);
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !rejectionReason) return;
    setDocs((prev) =>
      prev.map((d) =>
        d.id === selectedDoc.id
          ? { ...d, status: "REJECTED", rejectionReason, verifiedBy: "admin@alight.com" }
          : d
      )
    );
    setRejectModal(false);
    setRejectionReason("");
    setNotification(`Document ${selectedDoc.docNumber} marked as REJECTED`);
    setTimeout(() => setNotification(""), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-emerald-400" />
            Regulatory Compliance & Legal Document Center
          </h1>
          <p className="text-xs text-brand-slate-400">
            Verify vendor GSTIN tax filings, PAN records, corporate bank mandates, and BIS quality certifications.
          </p>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-700 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-brand-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by vendor or document number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-xs text-white placeholder-brand-slate-400 focus:outline-none focus:border-brand-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-xs text-brand-slate-200 focus:outline-none focus:border-brand-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Audit</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-xs text-brand-slate-200 focus:outline-none focus:border-brand-emerald-500"
          >
            <option value="ALL">All Document Types</option>
            <option value="GST_CERTIFICATE">GST Certificate</option>
            <option value="PAN_CARD">PAN Card</option>
            <option value="BANK_STATEMENT">Bank Statement</option>
            <option value="BIS_CERTIFICATE">BIS Certificate</option>
            <option value="BRAND_AUTHORIZATION">Brand Authorization</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-slate-900/80 text-brand-slate-400 font-semibold border-b border-brand-slate-700">
              <tr>
                <th className="py-3 px-4">Vendor & Store</th>
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4">Identifier / Number</th>
                <th className="py-3 px-4">Submission Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate-700/50">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-brand-slate-500 text-xs">
                    {loading ? "Loading compliance documents..." : "No compliance documents submitted for verification."}
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-brand-slate-750/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{doc.vendorName}</div>
                    <div className="text-[11px] text-brand-slate-400">{doc.storeName}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-slate-700 text-brand-slate-300 border border-brand-slate-600">
                      {doc.docType.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-white">
                    {doc.docNumber}
                  </td>
                  <td className="py-3 px-4 text-brand-slate-400 font-mono text-[11px]">
                    {doc.submittedAt}
                  </td>
                  <td className="py-3 px-4">
                    {doc.status === "VERIFIED" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-700">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    )}
                    {doc.status === "PENDING" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-700">
                        <Clock className="w-3 h-3" /> Pending Audit
                      </span>
                    )}
                    {doc.status === "REJECTED" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/60 text-rose-400 border border-rose-700">
                        <XCircle className="w-3 h-3" /> Rejected
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {doc.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleApprove(doc)}
                            className="px-2.5 py-1 bg-brand-emerald-800 hover:bg-brand-emerald-700 text-white rounded text-[11px] font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDoc(doc);
                              setRejectModal(true);
                            }}
                            className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-[11px] font-semibold"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-slate-850 border border-brand-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-slate-700">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Reject Compliance Document
              </h3>
              <button onClick={() => setRejectModal(false)} className="text-brand-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleReject} className="space-y-3 text-xs">
              <p className="text-brand-slate-300">
                Rejecting <strong className="text-white">{selectedDoc.docType}</strong> ({selectedDoc.docNumber}) submitted by <strong className="text-white">{selectedDoc.vendorName}</strong>.
              </p>

              <div>
                <label className="block text-brand-slate-300 font-medium mb-1">Rejection Reason</label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Legal entity name on GST certificate does not match the registered vendor corporate PAN..."
                  className="w-full px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-slate-700">
                <button
                  type="button"
                  onClick={() => setRejectModal(false)}
                  className="px-3 py-1.5 bg-brand-slate-700 text-brand-slate-300 rounded-lg hover:bg-brand-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-800 text-white rounded-lg hover:bg-rose-700 font-semibold"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
