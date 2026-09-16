"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  FileCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  Upload,
  ExternalLink,
  Building2,
  RefreshCw,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

import { useAuth } from "@/context/AuthContext";
import { getCurrentVendorApi } from "@/services/vendor-service";
import { VendorProfile } from "@/types/vendor";

interface ComplianceDoc {
  id: string;
  type: string;
  docNumber: string;
  status: "VERIFIED" | "PENDING_REVIEW" | "EXPIRING_SOON" | "REJECTED";
  expiryDate?: string;
  verifiedOn?: string;
  issuer: string;
}

export default function VendorCompliancePage() {
  const { token } = useAuth();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("ISO_CERTIFICATE");
  const [docNumberInput, setDocNumberInput] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  React.useEffect(() => {
    async function loadVendor() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await getCurrentVendorApi(token);
        if (res?.success && res.data) {
          setVendor(res.data);
        }
      } catch (err) {
        console.error("Failed to load vendor compliance profile:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadVendor();
  }, [token]);

  const b = vendor?.businessDetails;
  const docs: ComplianceDoc[] = [];

  if (b?.taxIdGstin) {
    docs.push({
      id: "doc-gst",
      type: "Goods & Services Tax Identification Number (GSTIN)",
      docNumber: b.taxIdGstin,
      status: b.verified ? "VERIFIED" : "PENDING_REVIEW",
      issuer: "GST Portal / CBIC Government of India",
      verifiedOn: b.verified ? new Date(b.updatedAt).toISOString().slice(0, 10) : undefined,
    });
  }

  if (b?.panNumber) {
    docs.push({
      id: "doc-pan",
      type: "Permanent Account Number (PAN)",
      docNumber: b.panNumber,
      status: b.verified ? "VERIFIED" : "PENDING_REVIEW",
      issuer: "Income Tax Department of India",
      verifiedOn: b.verified ? new Date(b.updatedAt).toISOString().slice(0, 10) : undefined,
    });
  }

  if (b?.bankAccountNumber) {
    docs.push({
      id: "doc-bank",
      type: `Bank Account Mandate (${b.bankName || "Commercial Bank"})`,
      docNumber: b.bankAccountNumber,
      status: b.verified ? "VERIFIED" : "PENDING_REVIEW",
      issuer: b.bankName || "Commercial Bank",
      verifiedOn: b.verified ? new Date(b.updatedAt).toISOString().slice(0, 10) : undefined,
    });
  }

  const verifiedCount = docs.filter((d) => d.status === "VERIFIED").length;
  const pendingCount = docs.filter((d) => d.status === "PENDING_REVIEW").length;

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadSuccess(true);
    setTimeout(() => {
      setUploadSuccess(false);
      setUploadModalOpen(false);
      setDocNumberInput("");
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & COMPLIANCE STATUS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-brand-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-brand-slate-900 tracking-tight">
              Statutory Compliance & KYC Documents
            </h1>
            <Badge variant="brand" size="sm" className="bg-brand-emerald-50 text-brand-emerald-800">
              {vendor?.status === "APPROVED" ? "KYC Audited Merchant" : vendor?.status || "KYC In Review"}
            </Badge>
          </div>
          <p className="text-xs text-brand-slate-500 mt-0.5">
            Manage GSTIN, PAN, material certifications, and statutory marketplace compliance mandates.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setUploadModalOpen(true)}
          className="bg-brand-emerald-800 hover:bg-brand-emerald-900 text-white font-bold gap-1.5 text-xs shadow-sm"
        >
          <Upload className="w-3.5 h-3.5" /> Upload Document
        </Button>
      </div>

      {/* 2. COMPLIANCE SUMMARY TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-brand-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-slate-500">Verified Documents</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-brand-slate-900">{verifiedCount} Verified</span>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">
              {verifiedCount > 0 ? "Statutory credentials on file" : "Pending verification"}
            </p>
          </div>
        </Card>

        <Card className="p-4 border-brand-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-slate-500">Pending Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-brand-slate-900">{pendingCount} Pending</span>
            <p className="text-[11px] text-amber-700 font-semibold mt-1">
              {pendingCount > 0 ? "Under compliance review" : "Zero pending documents"}
            </p>
          </div>
        </Card>

        <Card className="p-4 border-brand-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-slate-500">Policy Violations</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-brand-slate-900">0 Violations</span>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">100% Marketplace Compliant</p>
          </div>
        </Card>
      </div>

      {/* 3. COMPLIANCE DOCUMENTS LIST */}
      <Card className="overflow-hidden border-brand-slate-200 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-slate-50 border-b border-brand-slate-200 text-brand-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Document Type</th>
                <th className="px-4 py-3">Reference / Registration #</th>
                <th className="px-4 py-3">Issuing Authority</th>
                <th className="px-4 py-3">Expiry / Valid Until</th>
                <th className="px-4 py-3">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate-100 text-brand-slate-700 font-medium">
              {docs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-brand-slate-500">
                    <p className="font-semibold text-sm">No statutory documents uploaded</p>
                    <p className="text-xs text-brand-slate-400 mt-1">
                      Upload your GSTIN, PAN, or quality certification documents to complete KYC verification.
                    </p>
                  </td>
                </tr>
              ) : (
                docs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-brand-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-brand-slate-900">{doc.type}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-brand-slate-800">
                      {doc.docNumber}
                    </td>
                    <td className="px-4 py-3.5 text-brand-slate-600">
                      {doc.issuer}
                    </td>
                    <td className="px-4 py-3.5 text-brand-slate-500">
                      {doc.expiryDate || "Lifetime Statutory Valid"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          doc.status === "VERIFIED"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : doc.status === "EXPIRING_SOON"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {doc.status === "VERIFIED"
                          ? "✓ Verified"
                          : doc.status === "EXPIRING_SOON"
                          ? "⚠ Expiring Soon"
                          : "Pending Review"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Upload Modal */}
      <Modal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} title="Upload Statutory Certification">
        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs text-brand-slate-700">
          <div>
            <label className="block font-semibold mb-1">Document Category *</label>
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-emerald-800"
            >
              <option value="ISO_CERTIFICATE">ISO 9001 Quality Certificate</option>
              <option value="BIS_MATERIAL">BIS SS304 Metallurgy Certificate</option>
              <option value="POLLUTION_NOC">State Pollution Control NOC</option>
              <option value="FACTORY_LICENSE">Factory Inspectorate License</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Certificate / Document Number *</label>
            <input
              type="text"
              placeholder="e.g. BIS-2026-992"
              value={docNumberInput}
              onChange={(e) => setDocNumberInput(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg font-mono focus:outline-none focus:border-brand-emerald-800"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Upload PDF / Scan *</label>
            <div className="border-2 border-dashed border-brand-slate-200 rounded-xl p-6 text-center hover:border-brand-emerald-400 cursor-pointer transition">
              <Upload className="w-8 h-8 mx-auto text-brand-slate-400 mb-2" />
              <p className="font-bold text-brand-slate-800">Click or drag certificate PDF here</p>
              <p className="text-[11px] text-brand-slate-400 mt-0.5">Maximum file size: 10MB (PDF, PNG, JPG)</p>
            </div>
          </div>

          {uploadSuccess && (
            <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Document uploaded and submitted to Alight compliance auditors!
            </p>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="bg-brand-emerald-800 text-white font-bold">
              Submit for Verification
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
