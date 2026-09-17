"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Eye,
  Loader2,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

import { useAuth } from "@/context/AuthContext";
import {
  getCurrentVendorApi,
  updateKycDocumentsApi,
  updateVendorBusinessDetailsApi,
} from "@/services/vendor-service";
import { uploadSingleImageApi } from "@/services/media-service";
import { VendorProfile } from "@/types/vendor";

interface ComplianceDoc {
  id: string;
  category: "GST" | "PAN" | "BUSINESS_LICENSE" | "BANK";
  type: string;
  docNumber?: string;
  fileUrl?: string;
  status: "VERIFIED" | "PENDING_REVIEW" | "NOT_UPLOADED" | "REJECTED";
  issuer: string;
  verifiedOn?: string;
}

export default function VendorCompliancePage() {
  const { token } = useAuth();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocCategory, setSelectedDocCategory] = useState<"GST" | "PAN" | "BUSINESS_LICENSE">("GST");
  const [docNumberInput, setDocNumberInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadVendor = async () => {
    const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("alight_token") || "" : "");
    if (!activeToken) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await getCurrentVendorApi(activeToken);
      if (res?.success && res.data) {
        setVendor(res.data);
      }
    } catch (err) {
      console.error("Failed to load vendor compliance profile:", err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVendor();
  }, [token]);

  const b = vendor?.businessDetails;
  const isVendorApproved = vendor?.status === "APPROVED";

  const docs: ComplianceDoc[] = [
    {
      id: "doc-gst",
      category: "GST",
      type: "Goods & Services Tax Identification (GSTIN)",
      docNumber: b?.taxIdGstin || undefined,
      fileUrl: b?.taxCertificateUrl || undefined,
      status: b?.verified
        ? "VERIFIED"
        : b?.taxCertificateUrl || b?.taxIdGstin
        ? vendor?.status === "REJECTED"
          ? "REJECTED"
          : "PENDING_REVIEW"
        : "NOT_UPLOADED",
      issuer: "GST Portal / CBIC Government of India",
      verifiedOn: b?.verified && b?.updatedAt ? new Date(b.updatedAt).toISOString().slice(0, 10) : undefined,
    },
    {
      id: "doc-pan",
      category: "PAN",
      type: "Permanent Account Number (PAN) Card",
      docNumber: b?.panNumber || undefined,
      fileUrl: b?.idProofUrl || undefined,
      status: b?.verified
        ? "VERIFIED"
        : b?.idProofUrl || b?.panNumber
        ? vendor?.status === "REJECTED"
          ? "REJECTED"
          : "PENDING_REVIEW"
        : "NOT_UPLOADED",
      issuer: "Income Tax Department of India",
      verifiedOn: b?.verified && b?.updatedAt ? new Date(b.updatedAt).toISOString().slice(0, 10) : undefined,
    },
    {
      id: "doc-license",
      category: "BUSINESS_LICENSE",
      type: "Business Trade License / Incorporation Certificate",
      docNumber: b?.legalBusinessName ? `REG: ${b.businessType}` : undefined,
      fileUrl: b?.businessLicenseUrl || undefined,
      status: b?.verified
        ? "VERIFIED"
        : b?.businessLicenseUrl
        ? vendor?.status === "REJECTED"
          ? "REJECTED"
          : "PENDING_REVIEW"
        : "NOT_UPLOADED",
      issuer: "Ministry of Corporate Affairs / Municipal Corp",
      verifiedOn: b?.verified && b?.updatedAt ? new Date(b.updatedAt).toISOString().slice(0, 10) : undefined,
    },
    {
      id: "doc-bank",
      category: "BANK",
      type: `Bank Account Mandate (${b?.bankName || "Commercial Bank"})`,
      docNumber: b?.bankAccountNumber ? `••••${b.bankAccountNumber.slice(-4)} (${b.bankIfscCode})` : undefined,
      status: b?.verified
        ? "VERIFIED"
        : b?.bankAccountNumber && b.bankAccountNumber !== "PENDING"
        ? "PENDING_REVIEW"
        : "NOT_UPLOADED",
      issuer: b?.bankName || "Commercial Bank",
      verifiedOn: b?.verified && b?.updatedAt ? new Date(b.updatedAt).toISOString().slice(0, 10) : undefined,
    },
  ];

  const verifiedCount = docs.filter((d) => d.status === "VERIFIED").length;
  const pendingCount = docs.filter((d) => d.status === "PENDING_REVIEW").length;
  const missingCount = docs.filter((d) => d.status === "NOT_UPLOADED").length;

  const handleOpenUploadFor = (cat: "GST" | "PAN" | "BUSINESS_LICENSE", currentNumber?: string) => {
    setSelectedDocCategory(cat);
    setDocNumberInput(currentNumber || "");
    setSelectedFile(null);
    setUploadError(null);
    setUploadSuccessMsg(null);
    setUploadModalOpen(true);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccessMsg(null);

    const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("alight_token") || "" : "");
    if (!activeToken) {
      setUploadError("Authentication required. Please sign in.");
      return;
    }

    if (!selectedFile && !docNumberInput.trim()) {
      setUploadError("Please provide a certificate file or registration number.");
      return;
    }

    setUploading(true);
    try {
      let fileUrl: string | undefined = undefined;
      if (selectedFile) {
        fileUrl = await uploadSingleImageApi(selectedFile);
      }

      // Update KYC Document URL
      const kycPayload: {
        taxCertificateUrl?: string;
        idProofUrl?: string;
        businessLicenseUrl?: string;
      } = {};

      if (selectedDocCategory === "GST" && fileUrl) {
        kycPayload.taxCertificateUrl = fileUrl;
      } else if (selectedDocCategory === "PAN" && fileUrl) {
        kycPayload.idProofUrl = fileUrl;
      } else if (selectedDocCategory === "BUSINESS_LICENSE" && fileUrl) {
        kycPayload.businessLicenseUrl = fileUrl;
      }

      if (Object.keys(kycPayload).length > 0) {
        await updateKycDocumentsApi(kycPayload, activeToken);
      }

      // If document number was provided, update statutory business details
      if (docNumberInput.trim() && b) {
        const updateBizPayload = {
          legalBusinessName: b.legalBusinessName || vendor?.storeName || "Business",
          businessType: b.businessType || "INDIVIDUAL",
          taxIdGstin: selectedDocCategory === "GST" ? docNumberInput.trim() : b.taxIdGstin,
          panNumber: selectedDocCategory === "PAN" ? docNumberInput.trim() : b.panNumber,
          bankAccountNumber: b.bankAccountNumber || "PENDING",
          bankIfscCode: b.bankIfscCode || "PENDING",
          bankName: b.bankName || "Commercial Bank",
          bankAccountHolderName: b.bankAccountHolderName || b.legalBusinessName || "Account Holder",
        };
        await updateVendorBusinessDetailsApi(updateBizPayload, activeToken);
      }

      setUploadSuccessMsg("Document submitted successfully to Alight Compliance Auditors!");
      await loadVendor();
      setTimeout(() => {
        setUploadModalOpen(false);
        setSelectedFile(null);
        setDocNumberInput("");
        setUploadSuccessMsg(null);
      }, 1500);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setUploadError(e.message || "Failed to upload document. Please try again.");
    } finally {
      setUploading(false);
    }
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
            <Badge
              variant={isVendorApproved ? "success" : vendor?.status === "REJECTED" ? "error" : "brand"}
              size="sm"
            >
              {isVendorApproved
                ? "KYC Audited Merchant"
                : vendor?.status === "REJECTED"
                ? "KYC Rejected"
                : "KYC In Review"}
            </Badge>
          </div>
          <p className="text-xs text-brand-slate-500 mt-0.5">
            Manage GSTIN tax filings, corporate PAN records, trade licenses, and marketplace compliance mandates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRefreshing(true);
              loadVendor();
            }}
            disabled={refreshing}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenUploadFor("GST")}
            className="bg-brand-emerald-800 hover:bg-brand-emerald-900 text-white font-bold gap-1.5 text-xs shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" /> Upload Document
          </Button>
        </div>
      </div>

      {/* Vendor Status Rejection Alert if applicable */}
      {vendor?.status === "REJECTED" && vendor?.rejectionReason && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Compliance Review Feedback:</strong>
            <p className="mt-0.5 text-rose-700">{vendor.rejectionReason}</p>
            <p className="mt-1.5 text-[11px] text-rose-600">
              Please re-upload your correct documents below. Uploading fresh files will automatically resubmit your profile for administrative verification.
            </p>
          </div>
        </div>
      )}

      {/* 2. COMPLIANCE SUMMARY TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-brand-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-slate-500">Verified Credentials</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-brand-slate-900">{verifiedCount} Verified</span>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">
              {verifiedCount > 0 ? "Statutory credentials on file" : "Awaiting administrator audit"}
            </p>
          </div>
        </Card>

        <Card className="p-4 border-brand-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-slate-500">Under Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-brand-slate-900">{pendingCount} Pending</span>
            <p className="text-[11px] text-amber-700 font-semibold mt-1">
              {pendingCount > 0 ? "Submitted for compliance audit" : "No pending reviews"}
            </p>
          </div>
        </Card>

        <Card className="p-4 border-brand-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-slate-500">Action Required</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-brand-slate-900">{missingCount} Pending Upload</span>
            <p className="text-[11px] text-brand-slate-500 font-semibold mt-1">
              {missingCount === 0 ? "All core documents submitted" : "Upload missing documents"}
            </p>
          </div>
        </Card>
      </div>

      {/* 3. COMPLIANCE DOCUMENTS LIST */}
      <Card className="overflow-hidden border-brand-slate-200 shadow-2xs">
        <div className="p-4 border-b border-brand-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-brand-slate-900">Statutory Documents & Certifications</h2>
            <p className="text-[11px] text-brand-slate-500">
              Files uploaded here are directly reviewed by Alight Compliance Officers for marketplace authentication.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-slate-50 border-b border-brand-slate-200 text-brand-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Document Category</th>
                <th className="px-4 py-3">Reference / Registration #</th>
                <th className="px-4 py-3">Issuing Authority</th>
                <th className="px-4 py-3">File / Proof</th>
                <th className="px-4 py-3">Verification Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate-100 text-brand-slate-700 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-brand-slate-400">
                    Loading compliance documents...
                  </td>
                </tr>
              ) : (
                docs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-brand-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-brand-slate-900">{doc.type}</div>
                      <div className="text-[10px] text-brand-slate-400">Category: {doc.category}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-brand-slate-800">
                      {doc.docNumber || <span className="text-brand-slate-400 font-normal italic">Not recorded</span>}
                    </td>
                    <td className="px-4 py-3.5 text-brand-slate-600 text-[11px]">
                      {doc.issuer}
                    </td>
                    <td className="px-4 py-3.5">
                      {doc.fileUrl ? (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-emerald-700 hover:text-brand-emerald-900 underline"
                        >
                          <FileText className="w-3.5 h-3.5" /> View File <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-brand-slate-400 text-[11px] italic">No file attached</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          doc.status === "VERIFIED"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : doc.status === "PENDING_REVIEW"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : doc.status === "REJECTED"
                            ? "bg-rose-50 text-rose-800 border border-rose-200"
                            : "bg-brand-slate-100 text-brand-slate-600 border border-brand-slate-200"
                        }`}
                      >
                        {doc.status === "VERIFIED"
                          ? "✓ Verified"
                          : doc.status === "PENDING_REVIEW"
                          ? "⏳ Pending Review"
                          : doc.status === "REJECTED"
                          ? "✖ Rejected"
                          : "○ Not Uploaded"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {doc.category !== "BANK" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenUploadFor(doc.category as "GST" | "PAN" | "BUSINESS_LICENSE", doc.docNumber)}
                          className="text-xs h-7 px-2.5 font-semibold text-brand-slate-700"
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          {doc.fileUrl ? "Re-upload" : "Upload"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => !uploading && setUploadModalOpen(false)}
        title="Upload Statutory Certification / KYC Proof"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs text-brand-slate-700">
          <div>
            <label className="block font-semibold mb-1">Document Category *</label>
            <select
              value={selectedDocCategory}
              onChange={(e) => setSelectedDocCategory(e.target.value as "GST" | "PAN" | "BUSINESS_LICENSE")}
              disabled={uploading}
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-emerald-800 font-semibold"
            >
              <option value="GST">Goods & Services Tax (GST) Certificate</option>
              <option value="PAN">Permanent Account Number (PAN) Card</option>
              <option value="BUSINESS_LICENSE">Business Trade License / Certificate of Incorporation</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">
              {selectedDocCategory === "GST"
                ? "GSTIN Tax Number"
                : selectedDocCategory === "PAN"
                ? "10-Digit PAN Number"
                : "License / Registration Number"}
            </label>
            <input
              type="text"
              placeholder={
                selectedDocCategory === "GST"
                  ? "e.g. 27ABCDE1234F1Z5"
                  : selectedDocCategory === "PAN"
                  ? "e.g. ABCDE1234F"
                  : "e.g. CIN / MSME / Trade License #"
              }
              value={docNumberInput}
              onChange={(e) => setDocNumberInput(e.target.value)}
              disabled={uploading}
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg font-mono uppercase focus:outline-none focus:border-brand-emerald-800"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Upload Certificate File (PDF, PNG, JPG) *</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,application/pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
                selectedFile
                  ? "border-emerald-500 bg-emerald-50/40"
                  : "border-brand-slate-200 hover:border-brand-emerald-400 bg-brand-slate-50"
              }`}
            >
              {selectedFile ? (
                <div className="space-y-1">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 mb-1" />
                  <p className="font-bold text-brand-slate-900">{selectedFile.name}</p>
                  <p className="text-[11px] text-brand-slate-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Click to replace file
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-8 h-8 mx-auto text-brand-slate-400 mb-1" />
                  <p className="font-bold text-brand-slate-800">Click to choose PDF or Image file</p>
                  <p className="text-[11px] text-brand-slate-400">PDF, PNG, JPEG up to 10MB</p>
                </div>
              )}
            </div>
          </div>

          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadSuccessMsg}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              type="button"
              disabled={uploading}
              onClick={() => setUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={uploading}
              className="bg-brand-emerald-800 hover:bg-brand-emerald-900 text-white font-bold"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Uploading & Submitting...
                </>
              ) : (
                "Submit for Verification"
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
