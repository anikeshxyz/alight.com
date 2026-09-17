"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Store,
  Building2,
  MapPin,
  Percent,
  RefreshCw,
  Eye,
  Check,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  adminListVendorsApi,
  adminUpdateVendorStatusApi,
  adminUpdateCommissionApi,
} from "@/services/vendor-service";
import { VendorProfile, VendorStatus } from "@/types/vendor";

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null);

  // Modal Actions State
  const [actionModal, setActionModal] = useState<"approve" | "reject" | "commission" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [commissionRate, setCommissionRate] = useState("10.00");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("alight_token") || "";
      const res = await adminListVendorsApi(
        token,
        statusFilter || undefined,
        searchTerm || undefined
      );
      if (res.success && res.data) {
        setVendors(res.data.content || []);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch vendors", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVendors();
  };

  const handleUpdateStatus = async (status: VendorStatus, reason?: string) => {
    if (!selectedVendor) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const token = localStorage.getItem("alight_token") || "";
      const res = await adminUpdateVendorStatusApi(
        selectedVendor.id,
        { status, rejectionReason: reason },
        token
      );
      if (res.success) {
        setActionModal(null);
        setSelectedVendor(null);
        setRejectionReason("");
        fetchVendors();
      } else {
        setActionError(res.message || "Failed to update vendor status");
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setActionError(e.message || "Error updating vendor status");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCommission = async () => {
    if (!selectedVendor) return;
    const rate = parseFloat(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setActionError("Please provide a valid commission rate (0 - 100%)");
      return;
    }

    setSubmitting(true);
    setActionError(null);
    try {
      const token = localStorage.getItem("alight_token") || "";
      const res = await adminUpdateCommissionApi(
        selectedVendor.id,
        { commissionPercentage: rate },
        token
      );
      if (res.success) {
        setActionModal(null);
        setSelectedVendor(null);
        fetchVendors();
      } else {
        setActionError(res.message || "Failed to update commission rate");
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setActionError(e.message || "Error updating commission rate");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-slate-900">Vendor Management & Moderation</h1>
          <p className="text-xs text-brand-slate-500">
            Review vendor onboarding submissions, inspect KYC compliance, and configure commission tiers.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchVendors}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Filters & Search */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {[
              { label: "All Vendors", value: "" },
              { label: "Pending Review", value: "PENDING_VERIFICATION" },
              { label: "Approved", value: "APPROVED" },
              { label: "Rejected", value: "REJECTED" },
              { label: "Suspended", value: "SUSPENDED" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  statusFilter === tab.value
                    ? "bg-brand-burgundy text-white"
                    : "bg-brand-slate-100 text-brand-slate-600 hover:bg-brand-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-72">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate-400" />
              <input
                type="text"
                placeholder="Search store name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-brand-slate-50 border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
              />
            </div>
            <Button type="submit" variant="outline" size="sm">
              Search
            </Button>
          </form>
        </div>
      </Card>

      {/* Vendors Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-slate-50 border-b border-brand-slate-200 text-brand-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Store Details</th>
                <th className="px-4 py-3">Business Entity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Commission</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate-100 text-brand-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-brand-slate-400">
                    Loading vendor records...
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-brand-slate-400">
                    No vendor applications match the current filter.
                  </td>
                </tr>
              ) : (
                vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-brand-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-brand-slate-900">{v.storeName}</div>
                      <div className="text-[11px] text-brand-slate-500">{v.userEmail}</div>
                      <div className="text-[11px] text-brand-slate-400">{v.supportPhone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-brand-slate-800">
                        {v.businessDetails?.legalBusinessName || "N/A"}
                      </div>
                      <div className="text-[11px] text-brand-slate-500">
                        Type: {v.businessDetails?.businessType || "INDIVIDUAL"}
                      </div>
                      <div className="text-[11px] text-brand-slate-400">
                        GST: {v.businessDetails?.taxIdGstin || "Not provided"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          v.status === "APPROVED"
                            ? "success"
                            : v.status === "PENDING_VERIFICATION"
                            ? "brand"
                            : "error"
                        }
                      >
                        {v.status}
                      </Badge>
                      {v.rejectionReason && (
                        <p className="text-[10px] text-rose-600 mt-1 max-w-xs truncate" title={v.rejectionReason}>
                          {v.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-brand-slate-900">
                      {v.commissionPercentage}%
                    </td>
                    <td className="px-4 py-3 text-brand-slate-500 text-[11px]">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedVendor(v)}
                          title="View Full KYC Details"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View
                        </Button>

                        {v.status !== "APPROVED" && (
                          <button
                            onClick={() => {
                              setSelectedVendor(v);
                              setActionModal("approve");
                            }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Approve Vendor"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        {v.status !== "REJECTED" && (
                          <button
                            onClick={() => {
                              setSelectedVendor(v);
                              setActionModal("reject");
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Reject Vendor"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedVendor(v);
                            setCommissionRate(v.commissionPercentage.toString());
                            setActionModal("commission");
                          }}
                          className="p-1.5 text-brand-slate-500 hover:bg-brand-slate-100 rounded-lg transition-colors"
                          title="Configure Commission"
                        >
                          <Percent className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL: VIEW VENDOR KYC DETAILS */}
      <Modal
        isOpen={!!selectedVendor && !actionModal}
        onClose={() => setSelectedVendor(null)}
        title={selectedVendor?.storeName || "Vendor Details"}
      >
        {selectedVendor && (
          <div className="space-y-6 text-xs text-brand-slate-700">
            {/* Store Information */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-brand-slate-900 border-b pb-1">
                <Store className="w-4 h-4 text-brand-burgundy" /> Store Profile
              </div>
              <div className="grid grid-cols-2 gap-2 bg-brand-slate-50 p-3 rounded-xl border border-brand-slate-200">
                <div>
                  <span className="text-brand-slate-400">Store Slug:</span>{" "}
                  <span className="font-semibold">{selectedVendor.slug}</span>
                </div>
                <div>
                  <span className="text-brand-slate-400">Current Status:</span>{" "}
                  <Badge variant="brand" size="sm">{selectedVendor.status}</Badge>
                </div>
                <div>
                  <span className="text-brand-slate-400">Support Email:</span> {selectedVendor.supportEmail}
                </div>
                <div>
                  <span className="text-brand-slate-400">Support Phone:</span> {selectedVendor.supportPhone}
                </div>
                <div className="col-span-2">
                  <span className="text-brand-slate-400">Description:</span>{" "}
                  {selectedVendor.description || "None provided"}
                </div>
              </div>
            </div>

            {/* Business & Banking Details */}
            {selectedVendor.businessDetails && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-brand-slate-900 border-b pb-1">
                  <Building2 className="w-4 h-4 text-brand-burgundy" /> KYC & Banking Verification
                </div>
                <div className="grid grid-cols-2 gap-2 bg-brand-slate-50 p-3 rounded-xl border border-brand-slate-200">
                  <div>
                    <span className="text-brand-slate-400">Legal Entity:</span>{" "}
                    <span className="font-semibold">{selectedVendor.businessDetails.legalBusinessName}</span>
                  </div>
                  <div>
                    <span className="text-brand-slate-400">Business Type:</span>{" "}
                    {selectedVendor.businessDetails.businessType}
                  </div>
                  <div>
                    <span className="text-brand-slate-400">GSTIN:</span>{" "}
                    {selectedVendor.businessDetails.taxIdGstin || "N/A"}
                  </div>
                  <div>
                    <span className="text-brand-slate-400">PAN:</span>{" "}
                    {selectedVendor.businessDetails.panNumber || "N/A"}
                  </div>
                  <div>
                    <span className="text-brand-slate-400">Bank Name:</span>{" "}
                    {selectedVendor.businessDetails.bankName}
                  </div>
                  <div>
                    <span className="text-brand-slate-400">IFSC Code:</span>{" "}
                    {selectedVendor.businessDetails.bankIfscCode}
                  </div>
                  <div>
                    <span className="text-brand-slate-400">Account Holder:</span>{" "}
                    {selectedVendor.businessDetails.bankAccountHolderName}
                  </div>
                  <div>
                    <span className="text-brand-slate-400">Account No.:</span>{" "}
                    ••••••••{selectedVendor.businessDetails.bankAccountNumber.slice(-4)}
                  </div>
                </div>

                {/* Uploaded Verification Documents */}
                <div className="pt-2">
                  <span className="font-semibold text-brand-slate-800 block mb-1.5">Submitted KYC Files & Proofs:</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedVendor.businessDetails.taxCertificateUrl ? (
                      <a
                        href={selectedVendor.businessDetails.taxCertificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100"
                      >
                        <ExternalLink className="w-3 h-3" /> GST Certificate
                      </a>
                    ) : (
                      <span className="text-[11px] text-brand-slate-400 bg-brand-slate-100 px-2 py-0.5 rounded">No GST File</span>
                    )}

                    {selectedVendor.businessDetails.idProofUrl ? (
                      <a
                        href={selectedVendor.businessDetails.idProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100"
                      >
                        <ExternalLink className="w-3 h-3" /> PAN / ID Proof
                      </a>
                    ) : (
                      <span className="text-[11px] text-brand-slate-400 bg-brand-slate-100 px-2 py-0.5 rounded">No PAN File</span>
                    )}

                    {selectedVendor.businessDetails.businessLicenseUrl ? (
                      <a
                        href={selectedVendor.businessDetails.businessLicenseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100"
                      >
                        <ExternalLink className="w-3 h-3" /> Trade License
                      </a>
                    ) : (
                      <span className="text-[11px] text-brand-slate-400 bg-brand-slate-100 px-2 py-0.5 rounded">No License File</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Warehouse Pickup Addresses */}
            {selectedVendor.pickupAddresses && selectedVendor.pickupAddresses.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-brand-slate-900 border-b pb-1">
                  <MapPin className="w-4 h-4 text-brand-burgundy" /> Pickup Warehouse Locations
                </div>
                <div className="space-y-2">
                  {selectedVendor.pickupAddresses.map((addr) => (
                    <div key={addr.id} className="p-3 bg-brand-slate-50 rounded-xl border border-brand-slate-200">
                      <div className="flex justify-between font-semibold text-brand-slate-900">
                        <span>{addr.contactPerson} ({addr.contactPhone})</span>
                        {addr.primary && <Badge variant="brand" size="sm">Primary</Badge>}
                      </div>
                      <p className="text-brand-slate-500 mt-1">
                        {addr.addressLine1}{addr.addressLine2 && `, ${addr.addressLine2}`}, {addr.city}, {addr.state} - {addr.postalCode}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions in View Modal */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              {selectedVendor.status !== "REJECTED" && (
                <Button
                  variant="outline"
                  onClick={() => setActionModal("reject")}
                >
                  <X className="w-4 h-4 mr-1 text-rose-600" /> Reject
                </Button>
              )}
              {selectedVendor.status !== "APPROVED" && (
                <Button
                  variant="primary"
                  onClick={() => setActionModal("approve")}
                >
                  <Check className="w-4 h-4 mr-1" /> Approve Vendor
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: APPROVE VENDOR */}
      <Modal
        isOpen={actionModal === "approve"}
        onClose={() => setActionModal(null)}
        title="Approve Vendor Application"
      >
        <div className="space-y-4 text-sm text-brand-slate-700">
          <p>
            Are you sure you want to approve <span className="font-bold text-brand-slate-900">{selectedVendor?.storeName}</span>?
          </p>
          <p className="text-xs text-brand-slate-500">
            This action will mark the vendor as <strong>APPROVED</strong>, verify KYC banking details, and automatically grant seller portal permissions (<code className="text-brand-burgundy">ROLE_VENDOR</code>).
          </p>
          {actionError && <p className="text-xs text-rose-600 font-medium">{actionError}</p>}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setActionModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={submitting}
              onClick={() => handleUpdateStatus("APPROVED")}
            >
              Confirm Approval
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: REJECT VENDOR */}
      <Modal
        isOpen={actionModal === "reject"}
        onClose={() => setActionModal(null)}
        title="Reject Vendor Application"
      >
        <div className="space-y-4 text-sm text-brand-slate-700">
          <p>
            Please provide a specific reason for rejecting the vendor application of <span className="font-bold text-brand-slate-900">{selectedVendor?.storeName}</span>.
          </p>
          <div>
            <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
              Rejection Reason *
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Incomplete GSTIN documentation or invalid bank routing IFSC code..."
              className="w-full px-3 py-2 text-xs bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
            />
          </div>
          {actionError && <p className="text-xs text-rose-600 font-medium">{actionError}</p>}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setActionModal(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={submitting}
              onClick={() => handleUpdateStatus("REJECTED", rejectionReason)}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: CONFIGURE COMMISSION */}
      <Modal
        isOpen={actionModal === "commission"}
        onClose={() => setActionModal(null)}
        title="Configure Vendor Commission"
      >
        <div className="space-y-4 text-sm text-brand-slate-700">
          <p>
            Update the platform commission rate for <span className="font-bold text-brand-slate-900">{selectedVendor?.storeName}</span>.
          </p>
          <div>
            <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
              Commission Percentage (%) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-slate-400 font-bold">%</span>
            </div>
          </div>
          {actionError && <p className="text-xs text-rose-600 font-medium">{actionError}</p>}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setActionModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={submitting}
              onClick={handleUpdateCommission}
            >
              Save Commission Rate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
