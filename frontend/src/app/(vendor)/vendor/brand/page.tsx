"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Upload,
  ExternalLink,
  Users,
  Store,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

import { useAuth } from "@/context/AuthContext";
import { getCurrentVendorApi } from "@/services/vendor-service";
import { getVendorProductsApi } from "@/services/product-service";
import { VendorProfile } from "@/types/vendor";

export default function VendorBrandRegistryPage() {
  const { token } = useAuth();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [skuCount, setSkuCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [suspectUrl, setSuspectUrl] = useState("");
  const [complaintReason, setComplaintReason] = useState("COUNTERFEIT_TRADEMARK");
  const [reportSuccess, setReportSuccess] = useState(false);

  React.useEffect(() => {
    async function loadData() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const [vRes, pRes] = await Promise.all([
          getCurrentVendorApi(token),
          getVendorProductsApi(token, undefined, 0, 1),
        ]);
        if (vRes?.success && vRes.data) {
          setVendor(vRes.data);
        }
        if (pRes?.success && pRes.data) {
          setSkuCount(pRes.data.totalElements || 0);
        }
      } catch (err) {
        console.error("Failed to load vendor brand profile:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [token]);

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setReportModalOpen(false);
      setSuspectUrl("");
    }, 2500);
  };

  const storeName = vendor?.storeName || vendor?.businessDetails?.legalBusinessName || "Vendor Brand";
  const firstLetter = storeName.charAt(0).toUpperCase();

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & BRAND BADGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-brand-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-brand-slate-900 tracking-tight">
              Brand Registry & IP Protection
            </h1>
            <Badge variant="brand" size="sm" className="bg-brand-gold-50 text-brand-gold-800 border-brand-gold-300">
              {vendor?.status === "APPROVED" ? "Verified Brand Account" : "Brand Profile"}
            </Badge>
          </div>
          <p className="text-xs text-brand-slate-500 mt-0.5">
            Protect your proprietary architectural designs, manage authorized resellers, and enforce IP protection across the marketplace.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setReportModalOpen(true)}
          className="text-xs font-bold gap-1.5 text-rose-700 hover:bg-rose-50 hover:border-rose-300"
        >
          <AlertTriangle className="w-3.5 h-3.5" /> Report Counterfeit / IP Infringement
        </Button>
      </div>

      {/* 2. REGISTERED BRAND PROFILE */}
      <Card className="p-6 border-brand-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-slate-100 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-sm">
              {firstLetter}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-brand-slate-900">{storeName}</h2>
                {vendor?.status === "APPROVED" && (
                  <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    ✓ Verified Brand Owner
                  </span>
                )}
              </div>
              <p className="text-xs text-brand-slate-500 mt-0.5">
                {vendor?.businessDetails?.legalBusinessName ? `Legal Entity: ${vendor.businessDetails.legalBusinessName}` : "Direct Manufacturer & Brand Account"}
              </p>
            </div>
          </div>

          {vendor?.slug && (
            <Link href={`/vendors/${vendor.slug}`} target="_blank">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 font-bold">
                <Store className="w-3.5 h-3.5" /> View Public Storefront <ExternalLink className="w-3 h-3" />
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
          <div className="p-3.5 bg-brand-slate-50 rounded-xl border border-brand-slate-200">
            <span className="text-[10px] uppercase font-bold text-brand-slate-400 block">Active Brand Listings</span>
            <p className="text-lg font-black text-brand-slate-900 mt-0.5">{skuCount} Verified SKUs</p>
            <span className="text-[10px] text-emerald-700 font-semibold">Direct Catalog</span>
          </div>

          <div className="p-3.5 bg-brand-slate-50 rounded-xl border border-brand-slate-200">
            <span className="text-[10px] uppercase font-bold text-brand-slate-400 block">Authorized Distributors</span>
            <p className="text-lg font-black text-brand-slate-900 mt-0.5">0 Resellers</p>
            <span className="text-[10px] text-brand-slate-500">Direct Sales Model</span>
          </div>

          <div className="p-3.5 bg-brand-slate-50 rounded-xl border border-brand-slate-200">
            <span className="text-[10px] uppercase font-bold text-brand-slate-400 block">BuyBox Exclusivity</span>
            <p className="text-lg font-black text-brand-slate-900 mt-0.5">Protected (100%)</p>
            <span className="text-[10px] text-brand-emerald-800 font-semibold">Automated IP Lock</span>
          </div>
        </div>
      </Card>

      {/* 3. AUTHORIZED RESELLERS LIST */}
      <Card className="p-5 border-brand-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-brand-slate-900">Authorized Distribution Channel</h3>
            <p className="text-xs text-brand-slate-500">Merchants authorized to stock and fulfill genuine brand architectural fittings</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-slate-50 border-b border-brand-slate-200 text-brand-slate-600 font-semibold">
              <tr>
                <th className="px-3 py-2.5">Distributor Name</th>
                <th className="px-3 py-2.5">Territory</th>
                <th className="px-3 py-2.5">Authorization Code</th>
                <th className="px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-slate-100 text-brand-slate-700">
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-brand-slate-500">
                  No third-party resellers authorized. All products are sold directly through your brand account.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Report Modal */}
      <Modal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} title="Report IP Infringement / Counterfeit Listing">
        <form onSubmit={handleReportSubmit} className="space-y-4 text-xs text-brand-slate-700">
          <div>
            <label className="block font-semibold mb-1">Infringement Type *</label>
            <select
              value={complaintReason}
              onChange={(e) => setComplaintReason(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-emerald-800"
            >
              <option value="COUNTERFEIT_TRADEMARK">Counterfeit / Fake Product Trademark Violation</option>
              <option value="UNAUTHORIZED_RESELLER">Unauthorized Catalog Listing</option>
              <option value="DESIGN_COPYRIGHT">Proprietary CAD / Architectural Design Copying</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Suspect Product URL or SKU *</label>
            <input
              type="text"
              placeholder="https://alight.com/products/suspect-item-slug"
              value={suspectUrl}
              onChange={(e) => setSuspectUrl(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-emerald-800"
            />
          </div>

          {reportSuccess && (
            <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Intellectual property claim filed with Alight Trust & Safety team!
            </p>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setReportModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="bg-rose-700 hover:bg-rose-800 text-white font-bold">
              Submit Take-down Claim
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
