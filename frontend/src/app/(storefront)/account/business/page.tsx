"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getCustomerDashboardApi } from "@/services/user-service";
import { CustomerDashboardData } from "@/types/dashboard";
import { Button } from "@/components/ui/Button";
import {
  Building2,
  FileText,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Truck,
  DollarSign,
} from "lucide-react";

export default function CustomerBusinessPage() {
  const { user, token } = useAuth();
  const [data, setData] = useState<CustomerDashboardData | null>(null);

  useEffect(() => {
    if (token) {
      getCustomerDashboardApi(token)
        .then((res) => {
          if (res.success && res.data) {
            setData(res.data);
          }
        })
        .catch(() => {});
    }
  }, [token]);

  const activeRfqs = data?.metrics?.activeRfqs || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Enterprise & B2B Procurement Console
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              Commercial Tier
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Volume pricing, formal Requests for Quotations (RFQs), and tax compliance documents
          </p>
        </div>

        <Link href="/quotes">
          <Button variant="primary" size="sm" className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold border-none">
            Manage Active RFQs
          </Button>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/quotes"
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-amber-400 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Active RFQs</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{activeRfqs}</div>
          <p className="text-[11px] text-slate-500 mt-1">Direct inquiries with manufacturers</p>
        </Link>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Verified Quotes</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">Live</div>
          <p className="text-[11px] text-slate-500 mt-1">Ready for checkout conversion</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Tax Invoicing</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">GST B2B</div>
          <p className="text-[11px] text-slate-500 mt-1">Input tax credit eligible invoices</p>
        </div>
      </div>

      {/* B2B RFQ Flow Guide */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Alight B2B RFQ & Quote Negotiation Workflow
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
              STAGE 1
            </span>
            <h3 className="font-bold text-slate-900 pt-1">Create RFQ</h3>
            <p className="text-slate-600 text-[11px]">
              Specify products, required quantities, target prices, and project timeline.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
              STAGE 2
            </span>
            <h3 className="font-bold text-slate-900 pt-1">Vendor Review</h3>
            <p className="text-slate-600 text-[11px]">
              Vendors evaluate stock availability, manufacturing lead times, and shipping terms.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
              STAGE 3
            </span>
            <h3 className="font-bold text-slate-900 pt-1">Quote Received</h3>
            <p className="text-slate-600 text-[11px]">
              Review formal commercial quotes with discounted unit rates and MOQ constraints.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
              STAGE 4
            </span>
            <h3 className="font-bold text-slate-900 pt-1">Order Creation</h3>
            <p className="text-slate-600 text-[11px]">
              Accept the formal quote to instantly generate a master commercial order with invoice.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <Link href="/quotes">
            <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5">
              <span>Go to RFQs / Quotes Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Enterprise Procurement Assistance */}
      <div className="bg-gradient-to-br from-amber-50 to-amber-100/70 p-5 rounded-2xl border border-amber-200 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
            Commercial Project Bulk Support
          </h3>
          <p className="text-xs text-amber-900 leading-relaxed">
            Are you outfitting a residential development, commercial tower, or hotel? Alight&apos;s specialized
            commercial desk can coordinate with multiple hardware ateliers and synchronize staggered site deliveries.
          </p>
          <Link href="/support" className="inline-block pt-1 text-xs font-bold text-amber-950 underline hover:no-underline">
            Contact Commercial Project Desk →
          </Link>
        </div>
      </div>
    </div>
  );
}
