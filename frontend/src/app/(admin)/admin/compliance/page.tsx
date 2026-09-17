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
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { adminListVendorsApi, adminUpdateVendorStatusApi } from "@/services/vendor-service";

type DocType = "GST_CERTIFICATE" | "PAN_CARD" | "BANK_STATEMENT" | "BUSINESS_LICENSE" | "BIS_CERTIFICATE";
type DocStatus = "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED";

interface ComplianceDocument {
  id: string;
  vendorId: string;
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
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("alight_token") || "" : "";
      if (!token) {
        setDocs([]);
        return;
      }
      const res = await adminListVendorsApi(token, undefined, undefined, 0, 100);
      if (res.success && res.data && res.data.content) {
        const realDocs: ComplianceDocument[] = [];
        res.data.content.forEach((v) => {
          const b = v.businessDetails;
          const isVerified = b?.verified || v.status === "APPROVED";
          const isRejected = v.status === "REJECTED";
          const docStatus: DocStatus = isVerified ? "VERIFIED" : isRejected ? "REJECTED" : "PENDING";
          const formattedDate = v.createdAt ? new Date(v.createdAt).toISOString().slice(0, 10) : "Recent";

          // 1. GST Document
          if (b?.taxIdGstin || b?.taxCertificateUrl) {
            realDocs.push({
              id: `DOC-GST-${v.id}`,
              vendorId: v.id,
              vendorName: b?.legalBusinessName || v.storeName,
              storeName: v.storeName,
              docType: "GST_CERTIFICATE",
              docNumber: b?.taxIdGstin || "Certificate on file",
              fileUrl: b?.taxCertificateUrl || "",
              status: docStatus,
              submittedAt: formattedDate,
              rejectionReason: v.rejectionReason,
            });
          }

          // 2. PAN Card
          if (b?.panNumber || b?.idProofUrl) {
            realDocs.push({
              id: `DOC-PAN-${v.id}`,
              vendorId: v.id,
              vendorName: b?.legalBusinessName || v.storeName,
              storeName: v.storeName,
              docType: "PAN_CARD",
              docNumber: b?.panNumber || "ID Proof on file",
              fileUrl: b?.idProofUrl || "",
              status: docStatus,
              submittedAt: formattedDate,
              rejectionReason: v.rejectionReason,
            });
          }

          // 3. Business Trade License / Incorporation
          if (b?.businessLicenseUrl || b?.businessType) {
            realDocs.push({
              id: `DOC-LIC-${v.id}`,
              vendorId: v.id,
              vendorName: b?.legalBusinessName || v.storeName,
              storeName: v.storeName,
              docType: "BUSINESS_LICENSE",
              docNumber: b?.businessType ? `Type: ${b.businessType}` : "Trade License",
              fileUrl: b?.businessLicenseUrl || "",
              status: docStatus,
              submittedAt: formattedDate,
              rejectionReason: v.rejectionReason,
            });
          }

          // 4. Bank Account Mandate
          if (b?.bankAccountNumber && b.bankAccountNumber !== "PENDING") {
            realDocs.push({
              id: `DOC-BNK-${v.id}`,
              vendorId: v.id,
              vendorName: b?.legalBusinessName || v.storeName,
              storeName: v.storeName,
              docType: "BANK_STATEMENT",
              docNumber: `••••${b.bankAccountNumber.slice(-4)} (${b.bankName || "Bank"})`,
              fileUrl: "",
              status: docStatus,
              submittedAt: formattedDate,
              rejectionReason: v.rejectionReason,
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

  useEffect(() => {
    fetchDocs();
  }, []);

  const filteredDocs = docs.filter((d) => {
    const matchesSearch =
      d.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.docNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
    const matchesType = typeFilter === "ALL" || d.docType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleApprove = async (doc: ComplianceDocument) => {
    setActionLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("alight_token") || "" : "";
      const res = await adminUpdateVendorStatusApi(doc.vendorId, { status: "APPROVED" }, token);
      if (res.success) {
        setNotification(`✓ Vendor "${doc.storeName}" verified & approved. ROLE_VENDOR granted.`);
        await fetchDocs();
      } else {
        setNotification(`Failed to approve vendor: ${res.message || "Unknown error"}`);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setNotification(`Error approving vendor: ${e.message}`);
    } finally {
      setActionLoading(false);
      setTimeout(() => setNotification(""), 5000);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !rejectionReason.trim()) return;

    setActionLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("alight_token") || "" : "";
      const res = await adminUpdateVendorStatusApi(
        selectedDoc.vendorId,
        { status: "REJECTED", rejectionReason: rejectionReason.trim() },
        token
      );
      if (res.success) {
        setNotification(`Vendor "${selectedDoc.storeName}" application rejected with feedback.`);
        setRejectModal(false);
        setRejectionReason("");
        setSelectedDoc(null);
        await fetchDocs();
      } else {
        setNotification(`Failed to reject vendor: ${res.message || "Unknown error"}`);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setNotification(`Error rejecting vendor: ${e.message}`);
    } finally {
      setActionLoading(false);
      setTimeout(() => setNotification(""), 5000);
    }
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
            Verify vendor GSTIN tax filings, PAN records, trade licenses, and banking credentials for marketplace authorization.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchDocs}
          className="text-xs text-brand-slate-200 border-brand-slate-700 hover:bg-brand-slate-800"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh Records
        </Button>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate-400" />
            <input
              type="text"
              placeholder="Search vendor or doc number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-xs text-white placeholder-brand-slate-500 focus:outline-none focus:border-brand-emerald-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-xs text-brand-slate-300 focus:outline-none"
          >
            <option value="ALL">All Audit Statuses</option>
            <option value="PENDING">Pending Audit</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-xs text-brand-slate-300 focus:outline-none"
          >
            <option value="ALL">All Document Types</option>
            <option value="GST_CERTIFICATE">GST Certificate</option>
            <option value="PAN_CARD">PAN Card</option>
            <option value="BUSINESS_LICENSE">Business License</option>
            <option value="BANK_STATEMENT">Bank Mandate</option>
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
                <th className="py-3 px-4">Document Category</th>
                <th className="py-3 px-4">Identifier / Number</th>
                <th className="py-3 px-4">Proof File</th>
                <th className="py-3 px-4">Submission Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-brand-slate-500 text-xs">
                    Loading compliance documents...
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-brand-slate-500 text-xs">
                    No compliance documents match the current filter.
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
                    <td className="py-3 px-4">
                      {doc.fileUrl ? (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-emerald-400 hover:text-brand-emerald-300 underline"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Proof <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-brand-slate-500 text-[11px] italic">Document metadata</span>
                      )}
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
                        {doc.status !== "VERIFIED" && (
                          <button
                            onClick={() => handleApprove(doc)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-brand-emerald-800 hover:bg-brand-emerald-700 text-white rounded text-[11px] font-semibold shadow-xs"
                            title="Approve & Verify Vendor"
                          >
                            Approve
                          </button>
                        )}
                        {doc.status !== "REJECTED" && (
                          <button
                            onClick={() => {
                              setSelectedDoc(doc);
                              setRejectionReason(doc.rejectionReason || "");
                              setRejectModal(true);
                            }}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-[11px] font-semibold"
                            title="Reject Document / Application"
                          >
                            Reject
                          </button>
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
              <button
                onClick={() => setRejectModal(false)}
                className="text-brand-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReject} className="space-y-3 text-xs">
              <p className="text-brand-slate-300">
                Rejecting <strong className="text-white">{selectedDoc.docType.replace("_", " ")}</strong> ({selectedDoc.docNumber}) submitted by <strong className="text-white">{selectedDoc.storeName}</strong>.
              </p>

              <div>
                <label className="block text-brand-slate-300 font-medium mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Incomplete GST document or certificate details do not match corporate PAN entity..."
                  className="w-full px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-white placeholder-brand-slate-500 focus:outline-none focus:border-rose-500"
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
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-rose-800 hover:bg-rose-700 text-white rounded-lg font-semibold"
                >
                  {actionLoading ? "Submitting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
